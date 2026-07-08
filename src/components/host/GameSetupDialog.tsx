import { useEffect, useState } from "react";
import { Drill, Plane, Ship } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { NumberInput } from "@/components/ui/number-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { db } from "@/lib/db";
import {
  DEFAULT_DURATION_MINUTES,
  DEFAULT_QUESTION_TIME,
  DURATION_PRESETS,
  DURATION_STEP_MINUTES,
  GAME_TYPES,
  MAX_DURATION_MINUTES,
  MAX_QUESTION_TIME,
  MIN_DURATION_MINUTES,
  MIN_QUESTION_TIME,
  QUESTION_TIME_CTRL_SHIFT_STEP,
  QUESTION_TIME_CTRL_STEP,
  QUESTION_TIME_SHIFT_STEP,
  QUESTION_TIME_STEP,
  buildGameQuestionsSnapshot,
  buildPlayerQuestionsSnapshot,
  durationMinutesToSeconds,
  getDeckShuffleConfig,
  needsPerPlayerSnapshot,
  parseDurationMinutes,
  parseQuestionTimeSeconds,
  reshuffleForRepetition,
  secondsToDurationMinutes,
  type DeckShuffleConfig,
  type GameType,
  type ShuffleMode,
} from "@/lib/game";
import type { GameRecord, PlayerRecord, QuestionSnapshot } from "@/lib/types";
import { resetGameForRematch } from "@/lib/useHostGameEngine";

type DeckOption = {
  id: string;
  title: string;
  questions: {
    text: string;
    options: unknown;
    correctIndex: number;
    order: number;
    questionType?: unknown;
  }[];
  answerShuffleMode?: ShuffleMode | string | null;
  questionShuffleMode?: ShuffleMode | string | null;
  answerShuffleScope?: string | null;
  questionShuffleScope?: string | null;
  questionTimeSeconds?: number | null;
};

type GameSetupDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "rematch";
  decks: DeckOption[];
  initialDeckId?: string | null;
  initialGameType?: GameType;
  initialQuestionTime?: number;
  initialDurationSeconds?: number;
  rematchGame?: GameRecord | null;
  players?: PlayerRecord[];
  answerIds?: string[];
};

const GAME_ICONS = {
  deepDivers: Ship,
  deepDrillers: Drill,
  highFlyers: Plane,
} as const;

function buildPlayerSnapshotUpdates(
  players: PlayerRecord[],
  gameSnapshot: QuestionSnapshot[],
  settings: DeckShuffleConfig,
  sameDeck: boolean,
): { playerId: string; questionsSnapshot: QuestionSnapshot[] | null }[] {
  return players.map((player) => {
    if (sameDeck && player.questionsSnapshot) {
      return {
        playerId: player.id,
        questionsSnapshot: reshuffleForRepetition(
          player.questionsSnapshot,
          settings,
          "perPlayer",
          player.id,
        ),
      };
    }

    if (needsPerPlayerSnapshot(settings)) {
      return {
        playerId: player.id,
        questionsSnapshot: buildPlayerQuestionsSnapshot(
          gameSnapshot,
          settings,
          player.id,
        ),
      };
    }

    return {
      playerId: player.id,
      questionsSnapshot: [...gameSnapshot],
    };
  });
}

export function GameSetupDialog({
  open,
  onOpenChange,
  decks,
  initialDeckId,
  initialGameType = "deepDivers",
  initialQuestionTime = DEFAULT_QUESTION_TIME,
  initialDurationSeconds = DEFAULT_DURATION_MINUTES * 60,
  rematchGame,
  players = [],
  answerIds = [],
}: GameSetupDialogProps) {
  const { user } = db.useAuth();
  const [deckId, setDeckId] = useState(initialDeckId ?? decks[0]?.id ?? "");
  const [gameType, setGameType] = useState<GameType>(initialGameType);
  const [questionTime, setQuestionTime] = useState(String(initialQuestionTime));
  const [durationMinutes, setDurationMinutes] = useState(
    String(secondsToDurationMinutes(initialDurationSeconds)),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDeckId(initialDeckId ?? decks[0]?.id ?? "");
    setGameType(initialGameType);
    setDurationMinutes(String(secondsToDurationMinutes(initialDurationSeconds)));
    const initialDeck = decks.find(
      (deck) => deck.id === (initialDeckId ?? decks[0]?.id ?? ""),
    );
    setQuestionTime(
      String(
        initialDeck
          ? parseQuestionTimeSeconds(initialDeck.questionTimeSeconds)
          : initialQuestionTime,
      ),
    );
  }, [
    open,
    initialDeckId,
    decks,
    initialGameType,
    initialQuestionTime,
    initialDurationSeconds,
  ]);

  const selectedDeck = decks.find((deck) => deck.id === deckId);
  const shuffleSettings = getDeckShuffleConfig(
    rematchGame?.deckId === selectedDeck?.id ? rematchGame : selectedDeck,
  );
  const selectedGame = GAME_TYPES.find((type) => type.id === gameType);
  const hasQuestions = (selectedDeck?.questions.length ?? 0) > 0;

  const handleSubmit = async () => {
    if (!user || !rematchGame || !selectedDeck || !hasQuestions) return;

    setIsSubmitting(true);
    try {
      const sameDeck = rematchGame.deckId === selectedDeck.id;
      const questionsSnapshot = sameDeck
        ? reshuffleForRepetition(
            rematchGame.questionsSnapshot,
            shuffleSettings,
            "everyone",
          )
        : buildGameQuestionsSnapshot(selectedDeck.questions, shuffleSettings);

      const playerSnapshotUpdates = buildPlayerSnapshotUpdates(
        players,
        questionsSnapshot,
        shuffleSettings,
        sameDeck,
      );

      await resetGameForRematch({
        gameId: rematchGame.id,
        answerIds,
        gameType,
        questionsSnapshot,
        questionTimeSeconds: parseQuestionTimeSeconds(questionTime),
        durationSeconds: durationMinutesToSeconds(durationMinutes),
        deckTitle: selectedDeck.title,
        deckId: selectedDeck.id,
        ...shuffleSettings,
        playerSnapshotUpdates,
      });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Play again</DialogTitle>
          <DialogDescription>
            Pick a deck for the next run. Everyone stays in the lobby.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Deck</Label>
            <Select
              value={deckId}
              onValueChange={(value) => {
                setDeckId(value);
                const deck = decks.find((item) => item.id === value);
                if (deck) {
                  setQuestionTime(
                    String(parseQuestionTimeSeconds(deck.questionTimeSeconds)),
                  );
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a deck" />
              </SelectTrigger>
              <SelectContent>
                {decks.map((deck) => (
                  <SelectItem key={deck.id} value={deck.id}>
                    {deck.title} ({deck.questions.length} questions)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Game type</Label>
            <Select
              value={gameType}
              onValueChange={(value) => setGameType(value as GameType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GAME_TYPES.map((type) => {
                  const Icon = GAME_ICONS[type.id];
                  return (
                    <SelectItem key={type.id} value={type.id}>
                      <span className="flex items-center gap-2">
                        <Icon className="size-4" />
                        {type.name}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {selectedGame ? (
              <p className="text-xs text-muted-foreground">
                {selectedGame.description}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="question-time">Seconds per question</Label>
            <NumberInput
              id="question-time"
              value={questionTime}
              onChange={setQuestionTime}
              min={MIN_QUESTION_TIME}
              max={MAX_QUESTION_TIME}
              step={QUESTION_TIME_STEP}
              ctrlStep={QUESTION_TIME_CTRL_STEP}
              shiftStep={QUESTION_TIME_SHIFT_STEP}
              ctrlShiftStep={QUESTION_TIME_CTRL_SHIFT_STEP}
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="game-duration">Game duration (minutes)</Label>
            <NumberInput
              id="game-duration"
              value={durationMinutes}
              onChange={setDurationMinutes}
              min={MIN_DURATION_MINUTES}
              max={MAX_DURATION_MINUTES}
              step={DURATION_STEP_MINUTES}
            />
            <div className="flex flex-wrap gap-2">
              {DURATION_PRESETS.map((preset) => (
                <Button
                  key={preset.minutes}
                  type="button"
                  size="sm"
                  variant={
                    parseDurationMinutes(durationMinutes) === preset.minutes
                      ? "default"
                      : "outline"
                  }
                  onClick={() => setDurationMinutes(String(preset.minutes))}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={() => void handleSubmit()}
            disabled={isSubmitting || !hasQuestions}
          >
            {isSubmitting ? "Saving..." : "Reset to lobby"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Authored deck → snapshot without shuffling (for listing / rematch deck options). */
export function toSnapshot(
  questions: {
    text: string;
    options: unknown;
    correctIndex: number;
    order: number;
    questionType?: unknown;
  }[],
): QuestionSnapshot[] {
  return buildGameQuestionsSnapshot(questions, {
    answerShuffleMode: "none",
    questionShuffleMode: "none",
    answerShuffleScope: "everyone",
    questionShuffleScope: "everyone",
  });
}
