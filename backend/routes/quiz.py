from fastapi import APIRouter, Depends, HTTPException, Body
import random
from pydantic import BaseModel
from typing import List

from security import get_current_user
from models import User

router = APIRouter()

questions = [
    {
        "id": 1,
        "text": "What command lists directory contents?",
        "options": ["ls", "cd", "rm", "pwd"],
        "correct": "ls"
    },
    {
        "id": 2,
        "text": "Which command searches for text in files?",
        "options": ["find", "grep", "locate", "cat"],
        "correct": "grep"
    },
    {
        "id": 3,
        "text": "What changes file permissions?",
        "options": ["chmod", "chown", "mv", "cp"],
        "correct": "chmod"
    },
    {
        "id": 4,
        "text": "Which command displays the current directory?",
        "options": ["dir", "pwd", "path", "where"],
        "correct": "pwd"
    },
    {
        "id": 5,
        "text": "What removes a file?",
        "options": ["rm", "del", "erase", "unlink"],
        "correct": "rm"
    }
]

class QuizQuestion(BaseModel):
    id: int
    text: str
    options: List[str]

class Answer(BaseModel):
    question_id: int
    selected_answer: str | None

class QuizSubmission(BaseModel):
    answers: List[Answer]

class QuizResult(BaseModel):
    score: int
    total: int

@router.get("/questions", response_model=List[QuizQuestion])
async def get_quiz_questions(current_user: User = Depends(get_current_user)):
    random.shuffle(questions)
    return [
        QuizQuestion(id=q["id"], text=q["text"], options=q["options"])
        for q in questions
    ]

@router.post("/submit", response_model=QuizResult)
async def submit_quiz_answers(submission: QuizSubmission, current_user: User = Depends(get_current_user)):
    score = 0
    total = len(questions)

    correct_answers = {q["id"]: q["correct"] for q in questions}

    for answer in submission.answers:
        if answer.question_id in correct_answers and answer.selected_answer == correct_answers[answer.question_id]:
            score += 1

    return QuizResult(score=score, total=total)
