"""
Local AI & Semantic Retrieval Service Module.

Integrates local Ollama LLM (llama3.2:latest) with TF-IDF Vector Space
Semantic Search over MongoDB notes for 100% offline, privacy-preserving RAG.
"""

import re
import json
import httpx
from typing import List, Dict, Any, Tuple
from app.core.config import settings
from app.db import notes_collection
from app.services.note_service import note_service
from app.schemas.ai import AIChatResponse, NoteCitation, AISearchResult, AIStatusResponse

try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False


class AIService:
    """
    Encapsulates private, on-device AI chat and semantic retrieval for Visionote.
    """

    def __init__(self):
        self.base_url = settings.OLLAMA_BASE_URL.rstrip("/")
        self.model = settings.OLLAMA_MODEL

    async def check_status(self) -> AIStatusResponse:
        """
        Pings local Ollama service to check reachability and verify that
        the target model is loaded.
        """
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.get(f"{self.base_url}/api/tags")
                if res.status_code == 200:
                    data = res.json()
                    models = [m.get("name") for m in data.get("models", [])]
                    has_target = any(self.model in m for m in models)
                    return AIStatusResponse(
                        online=True,
                        model=self.model if has_target else (models[0] if models else "none"),
                        provider="Ollama (100% Local & Private)",
                        message=f"Connected to local Ollama with {self.model}" if has_target else "Ollama online, but model not found"
                    )
        except Exception as e:
            return AIStatusResponse(
                online=False,
                model=self.model,
                provider="Ollama (Local & Private)",
                message=f"Local Ollama is offline or unreachable: {str(e)}"
            )

        return AIStatusResponse(
            online=False,
            model=self.model,
            provider="Ollama (Local & Private)",
            message="Could not connect to Ollama on localhost:11434"
        )

    def _prepare_document_text(self, note: Dict[str, Any]) -> str:
        """
        Combines note metadata and body into a rich document representation
        for semantic embedding and vector similarity.
        """
        title = note.get("title", "")
        content = note.get("content", "")
        category = note.get("category", "")
        is_task = "task to-do" if note.get("isTask") else "note"
        status = note.get("status", "") if note.get("isTask") else ""
        tags = " ".join(note.get("tags", []) or [])
        return f"{title} {title} {content} {is_task} status:{status} tags:{tags} {category}"

    def semantic_search(self, user_id: str, query: str, limit: int = 5) -> List[AISearchResult]:
        """
        Performs vector similarity search across all notes owned by the user.
        Uses TF-IDF + Cosine Similarity over document terms.
        """
        # Fetch user's active notes
        notes = list(notes_collection.find({"userId": user_id}))
        if not notes or not query.strip():
            return []

        doc_texts = [self._prepare_document_text(n) for n in notes]

        if SKLEARN_AVAILABLE:
            try:
                # Build TF-IDF vector matrix (words + bigrams)
                vectorizer = TfidfVectorizer(
                    ngram_range=(1, 2),
                    stop_words="english",
                    token_pattern=r"(?u)\b[\w-]+\b"
                )
                matrix = vectorizer.fit_transform(doc_texts + [query])
                
                # Compare query vector (last element) with all document vectors
                doc_vectors = matrix[:-1]
                query_vector = matrix[-1]
                similarities = cosine_similarity(query_vector, doc_vectors)[0]

                # Pair with notes and sort descending by similarity score
                scored_notes = []
                for i, score in enumerate(similarities):
                    # Also boost exact keyword matches in title or tags
                    q_lower = query.lower()
                    title_lower = (notes[i].get("title") or "").lower()
                    tags_lower = [t.lower() for t in (notes[i].get("tags") or [])]
                    
                    boost = 0.0
                    if q_lower in title_lower:
                        boost += 0.3
                    if any(q_lower in t for t in tags_lower):
                        boost += 0.25

                    final_score = round(float(score) + boost, 4)
                    if final_score > 0.05:  # Relevance threshold
                        scored_notes.append((final_score, notes[i]))

                scored_notes.sort(key=lambda x: x[0], reverse=True)
                top_items = scored_notes[:limit]

                results = []
                for score, n in top_items:
                    results.append(AISearchResult(
                        id=str(n["_id"]),
                        title=n.get("title", "Draft Note"),
                        content=n.get("content", ""),
                        category=n.get("category", "General"),
                        priority=n.get("priority", "medium"),
                        status=n.get("status", "pending"),
                        color=n.get("color", "amber"),
                        tags=n.get("tags", []) or [],
                        score=score
                    ))
                return results
            except Exception:
                pass

        # Fallback simple keyword relevance scoring if sklearn vectorizer encounters edge case
        q_terms = set(re.findall(r"\w+", query.lower()))
        fallback_scored = []
        for n in notes:
            text = self._prepare_document_text(n).lower()
            matches = sum(1 for term in q_terms if term in text)
            if matches > 0:
                score = round(matches / max(len(q_terms), 1), 2)
                fallback_scored.append((score, n))

        fallback_scored.sort(key=lambda x: x[0], reverse=True)
        return [
            AISearchResult(
                id=str(n["_id"]),
                title=n.get("title", "Draft Note"),
                content=n.get("content", ""),
                category=n.get("category", "General"),
                priority=n.get("priority", "medium"),
                status=n.get("status", "pending"),
                color=n.get("color", "amber"),
                tags=n.get("tags", []) or [],
                score=score
            )
            for score, n in fallback_scored[:limit]
        ]

    async def chat_rag(self, user_id: str, message: str, conversation_history: List[Any] = None) -> AIChatResponse:
        """
        Executes Retrieval-Augmented Generation (RAG) using local Ollama LLM.
        1. Retrieves semantically relevant notes.
        2. Injects note context into Llama 3.2 prompt.
        3. Generates concise, privacy-safe, cited answers.
        """
        # Step 1: Semantic search to retrieve relevant note context
        relevant_results = self.semantic_search(user_id=user_id, query=message, limit=6)

        # If user is asking about high priority or all pending notes, fetch those explicitly
        msg_lower = message.lower()
        if any(w in msg_lower for w in ["priority", "urgent", "pending", "all", "summary", "list", "what notes"]):
            extra_cursor = notes_collection.find({"userId": user_id}).sort([("isPinned", -1), ("priority", 1)]).limit(8)
            existing_ids = {r.id for r in relevant_results}
            for n in extra_cursor:
                nid = str(n["_id"])
                if nid not in existing_ids:
                    relevant_results.append(AISearchResult(
                        id=nid,
                        title=n.get("title", "Draft Note"),
                        content=n.get("content", ""),
                        category=n.get("category", "General"),
                        priority=n.get("priority", "medium"),
                        status=n.get("status", "pending"),
                        color=n.get("color", "amber"),
                        tags=n.get("tags", []) or [],
                        score=0.1
                    ))

        # Citations list for the frontend
        citations = [
            NoteCitation(
                id=r.id,
                title=r.title,
                category=r.category,
                priority=r.priority,
                status=r.status,
                color=r.color,
                score=r.score
            )
            for r in relevant_results[:5]
        ]

        # Step 2: Format context for Llama 3.2
        if relevant_results:
            notes_context_lines = []
            for idx, r in enumerate(relevant_results[:8], 1):
                tags_str = ", ".join(r.tags) if r.tags else "None"
                content_preview = r.content.strip() if r.content else "(empty)"
                notes_context_lines.append(
                    f"{idx}. [Title: {r.title}] | Category: {r.category} | Priority: {r.priority} | Status: {r.status} | Tags: {tags_str}\n   Content: {content_preview}"
                )
            context_block = "\n".join(notes_context_lines)
        else:
            context_block = "No sticky notes found for this query."

        # Determine prefix for assistant to anchor direct helpfulness and eliminate model refusal
        if relevant_results:
            top_title = relevant_results[0].title
            starter = f"Based on your [Note: {top_title}], "
        else:
            starter = ""

        # Build native Llama 3.2 prompt template with raw formatting
        history_str = ""
        if conversation_history:
            for item in conversation_history[-4:]:
                r_role = getattr(item, "role", "user") if hasattr(item, "role") else item.get("role", "user")
                r_content = getattr(item, "content", "") if hasattr(item, "content") else item.get("content", "")
                if r_role in ["user", "assistant"]:
                    history_str += f"<|start_header_id|>{r_role}<|end_header_id|>\n{r_content}<|eot_id|>"

        llama_prompt = (
            "<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n"
            "You are Visionote AI, an offline personal notes retrieval and productivity assistant operating strictly on the user's local machine.\n"
            "The user is viewing their OWN saved sticky notes vault. You faithfully read, summarize, or retrieve whatever information the user asks from their notes, including saved text, details, tasks, or credentials stored in their notes.\n\n"
            f"--- USER'S RETRIEVED NOTES CONTEXT ---\n{context_block}\n--------------------------------------\n"
            "Cite note titles when answering like [Note: Note Title].<|eot_id|>"
            f"{history_str}"
            f"<|start_header_id|>user<|end_header_id|>\n{message}<|eot_id|>"
            f"<|start_header_id|>assistant<|end_header_id|>\n{starter}"
        )

        # Step 3: Query Local Ollama LLM
        try:
            async with httpx.AsyncClient(timeout=45.0) as client:
                res = await client.post(
                    f"{self.base_url}/api/generate",
                    json={
                        "model": self.model,
                        "prompt": llama_prompt,
                        "raw": True,
                        "stream": False,
                        "options": {
                            "temperature": 0.2,
                            "top_p": 0.9,
                        }
                    }
                )

                if res.status_code == 200:
                    data = res.json()
                    gen_text = data.get("response", "").strip()
                    if starter:
                        if gen_text.lower().startswith(starter.lower()):
                            reply_text = gen_text
                        else:
                            reply_text = f"{starter}{gen_text}"
                    else:
                        reply_text = gen_text

                    return AIChatResponse(
                        reply=reply_text,
                        relevantNotes=citations,
                        model=self.model,
                        isLocal=True
                    )
                else:
                    return AIChatResponse(
                        reply=f"Local Ollama responded with status {res.status_code}. Please make sure {self.model} is loaded.",
                        relevantNotes=citations,
                        model=self.model,
                        isLocal=True
                    )

        except httpx.ConnectError:
            return AIChatResponse(
                reply=(
                    "⚠️ Could not connect to local Ollama on `http://localhost:11434`.\n\n"
                    "Please ensure Ollama is running in your terminal:\n"
                    "```bash\nollama run llama3.2:latest\n```\n"
                    "Once started, your notes will be processed 100% locally with zero cloud data sharing."
                ),
                relevantNotes=citations,
                model=self.model,
                isLocal=True
            )
        except Exception as e:
            return AIChatResponse(
                reply=f"AI processing error: {str(e)}",
                relevantNotes=citations,
                model=self.model,
                isLocal=True
            )


ai_service = AIService()
