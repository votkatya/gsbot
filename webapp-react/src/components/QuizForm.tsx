import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

interface QuizQuestion {
  question: string;
  answers: Array<{ text: string; correct: boolean }>;
}

interface QuizFormProps {
  questions: QuizQuestion[];
  onSubmit: (score: number) => void;
  isLoading?: boolean;
}

export const QuizForm = ({ questions, onSubmit, isLoading }: QuizFormProps) => {
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>(new Array(questions.length).fill(-1));
  const [showResults, setShowResults] = useState(false);

  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[questionIndex] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  const allQuestionsAnswered = selectedAnswers.every((answer) => answer !== -1);

  const handleShowResults = () => {
    setShowResults(true);
  };

  const calculateScore = () => {
    return selectedAnswers.reduce((score, answerIndex, questionIndex) => {
      if (answerIndex !== -1 && questions[questionIndex].answers[answerIndex].correct) {
        return score + 1;
      }
      return score;
    }, 0);
  };

  const score = calculateScore();

  return (
    <div className="space-y-6">
      {questions.map((question, qIndex) => (
        <div key={qIndex} className="space-y-3">
          <h3 className="font-semibold text-foreground">
            {qIndex + 1}. {question.question}
          </h3>
          <div className="space-y-2">
            {question.answers.map((answer, aIndex) => {
              const isSelected = selectedAnswers[qIndex] === aIndex;
              const isCorrect = answer.correct;
              const shouldShowCorrect = showResults && isCorrect;
              const shouldShowIncorrect = showResults && isSelected && !isCorrect;

              return (
                <button
                  key={aIndex}
                  onClick={() => !showResults && handleAnswerSelect(qIndex, aIndex)}
                  disabled={showResults}
                  className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
                    shouldShowCorrect
                      ? "border-success bg-success/10"
                      : shouldShowIncorrect
                      ? "border-destructive bg-destructive/10"
                      : isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={shouldShowCorrect ? "text-success font-medium" : "text-foreground"}>
                      {answer.text}
                    </span>
                    {shouldShowCorrect && <CheckCircle2 className="h-5 w-5 text-success" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {!showResults ? (
        <Button
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          size="lg"
          disabled={!allQuestionsAnswered}
          onClick={handleShowResults}
        >
          Показать результаты
        </Button>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl bg-primary/10 border border-primary/20 p-4 text-center">
            <p className="text-2xl font-bold text-primary mb-1">
              {score} из {questions.length}
            </p>
            <p className="text-sm text-muted-foreground">
              {score === questions.length
                ? "Отлично! Ты настоящий эксперт! 🏆"
                : score >= questions.length / 2
                ? "Неплохо! Но есть куда расти 💪"
                : "Приходи почаще - узнаешь больше! 😊"}
            </p>
          </div>

          <Button
            className="w-full bg-success text-white hover:bg-success/90"
            size="lg"
            disabled={isLoading}
            onClick={() => onSubmit(score)}
          >
            {isLoading ? "Сохраняем..." : "Получить награду"}
          </Button>
        </div>
      )}
    </div>
  );
};
