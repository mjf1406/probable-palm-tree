import type {
  GameType,
  GameStatus,
  QuestionType,
  ShuffleMode,
} from "@/lib/game";

export type QuestionSnapshot = {
  text: string;
  options: string[];
  correctIndex: number;
  questionType: QuestionType;
};

export type DeckQuestion = {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  order: number;
  questionType?: QuestionType | null;
};

export type DeckShuffleSettings = {
  answerShuffleMode: ShuffleMode;
  questionShuffleMode: ShuffleMode;
};

export type GameRecord = {
  id: string;
  code: string;
  gameType: GameType;
  status: GameStatus;
  currentQuestionIndex: number;
  questionStartedAt?: number | null;
  progress: number;
  lives: number;
  questionTimeSeconds: number;
  questionsSnapshot: QuestionSnapshot[];
  createdAt: number;
  deckTitle?: string | null;
  deckId?: string | null;
  endedAt?: number | null;
  host?: { id: string } | null;
};

export type PlayerRecord = {
  id: string;
  nickname: string;
  joinedAt: number;
  iconId?: string | null;
  avatarColor?: string | null;
  user?: { id: string } | null;
};

export type AnswerRecord = {
  id: string;
  questionIndex: number;
  choiceIndex: number;
  isCorrect: boolean;
  answeredAt: number;
  player?: { id: string; nickname: string } | null;
};
