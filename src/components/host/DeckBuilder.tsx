import { useState } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { id } from "@instantdb/react";
import {
  ArrowDown,
  ArrowUp,
  Plus,
  Square,
  SquareCheckBig,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { db } from "@/lib/db";
import {
  SHUFFLE_MODES,
  parseQuestionType,
  parseShuffleMode,
  type QuestionType,
  type ShuffleMode,
} from "@/lib/game";
import { cn } from "@/lib/utils";

const MIN_MC_OPTIONS = 2;
const INITIAL_MC_OPTIONS = 4;
const MAX_MC_OPTIONS = 8;
const TF_OPTIONS = ["True", "False"] as const;

function createEmptyOptions(count: number) {
  return Array.from({ length: count }, () => "");
}

function DeckDetailsForm({
  deck,
}: {
  deck: { id: string; title: string; description?: string | null };
}) {
  const [title, setTitle] = useState(deck.title);
  const [description, setDescription] = useState(deck.description ?? "");

  const handleSaveDeck = async () => {
    await db.transact(
      db.tx.decks[deck.id].update({
        title: title.trim(),
        description: description.trim(),
      }),
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Deck details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={2}
          />
        </div>
        <Button onClick={() => void handleSaveDeck()}>Save details</Button>
      </CardContent>
    </Card>
  );
}

function DeckSettingsForm({
  deck,
}: {
  deck: {
    id: string;
    answerShuffleMode?: string | null;
    questionShuffleMode?: string | null;
  };
}) {
  const [answerShuffleMode, setAnswerShuffleMode] = useState<ShuffleMode>(
    parseShuffleMode(deck.answerShuffleMode),
  );
  const [questionShuffleMode, setQuestionShuffleMode] = useState<ShuffleMode>(
    parseShuffleMode(deck.questionShuffleMode),
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await db.transact(
        db.tx.decks[deck.id].update({
          answerShuffleMode,
          questionShuffleMode,
        }),
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Settings</CardTitle>
        <CardDescription>
          Control how questions and answer options are ordered when this deck
          is launched or rematched.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Answer option order</Label>
          <Select
            value={answerShuffleMode}
            onValueChange={(value) =>
              setAnswerShuffleMode(parseShuffleMode(value))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SHUFFLE_MODES.map((mode) => (
                <SelectItem key={mode.id} value={mode.id}>
                  {mode.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {
              SHUFFLE_MODES.find((mode) => mode.id === answerShuffleMode)
                ?.description
            }
          </p>
        </div>

        <div className="space-y-2">
          <Label>Question order</Label>
          <Select
            value={questionShuffleMode}
            onValueChange={(value) =>
              setQuestionShuffleMode(parseShuffleMode(value))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SHUFFLE_MODES.map((mode) => (
                <SelectItem key={mode.id} value={mode.id}>
                  {mode.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {
              SHUFFLE_MODES.find((mode) => mode.id === questionShuffleMode)
                ?.description
            }
          </p>
        </div>

        <Button onClick={() => void handleSave()} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save settings"}
        </Button>
      </CardContent>
    </Card>
  );
}

function CorrectOptionButton({
  selected,
  disabled,
  onClick,
}: {
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  const Icon = selected ? SquareCheckBig : Square;

  return (
    <Button
      type="button"
      variant={selected ? "default" : "outline"}
      size="sm"
      disabled={disabled}
      onClick={onClick}
      className={cn("gap-1.5", selected && "bg-primary text-primary-foreground")}
    >
      <Icon className="size-4" />
      Correct
    </Button>
  );
}

export function DeckBuilder() {
  const { deckId } = useParams({ from: "/_host/d/$deckId" });
  const { user } = db.useAuth();
  const { isLoading, data, error } = db.useQuery({
    decks: {
      $: { where: { id: deckId } },
      questions: {},
      owner: {},
    },
  });

  const deck = data?.decks?.[0];
  const isOwner = Boolean(deck && user && deck.owner?.id === user.id);
  const questions = [...(deck?.questions ?? [])].sort(
    (a, b) => a.order - b.order,
  );

  const [draftType, setDraftType] = useState<QuestionType>("mc");
  const [draftText, setDraftText] = useState("");
  const [draftOptions, setDraftOptions] = useState(() =>
    createEmptyOptions(INITIAL_MC_OPTIONS),
  );
  const [draftCorrect, setDraftCorrect] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);

  const trimmedDraftOptions = draftOptions.map((option) => option.trim());
  const nonEmptyDraftOptionsCount = trimmedDraftOptions.filter(Boolean).length;
  const canSaveQuestion =
    Boolean(draftText.trim()) &&
    (draftType === "tf"
      ? draftCorrect === 0 || draftCorrect === 1
      : nonEmptyDraftOptionsCount >= MIN_MC_OPTIONS &&
        Boolean(trimmedDraftOptions[draftCorrect]));

  const resetDraft = () => {
    setDraftType("mc");
    setDraftText("");
    setDraftOptions(createEmptyOptions(INITIAL_MC_OPTIONS));
    setDraftCorrect(0);
    setEditingId(null);
  };

  const handleTypeChange = (nextType: QuestionType) => {
    setDraftType(nextType);
    if (nextType === "tf") {
      setDraftOptions([...TF_OPTIONS]);
      setDraftCorrect(0);
    } else {
      setDraftOptions(createEmptyOptions(INITIAL_MC_OPTIONS));
      setDraftCorrect(0);
    }
  };

  const handleAddOption = () => {
    if (draftOptions.length >= MAX_MC_OPTIONS) return;
    setDraftOptions([...draftOptions, ""]);
  };

  const handleRemoveOption = (index: number) => {
    if (draftOptions.length <= INITIAL_MC_OPTIONS) return;
    const next = draftOptions.filter((_, i) => i !== index);
    setDraftOptions(next);
    if (draftCorrect === index) {
      const firstFilled = next.findIndex((v) => Boolean(v.trim()));
      setDraftCorrect(firstFilled >= 0 ? firstFilled : 0);
    } else if (draftCorrect > index) {
      setDraftCorrect(draftCorrect - 1);
    }
  };

  const handleSaveQuestion = async () => {
    if (!deck || !draftText.trim()) return;

    let nonEmptyOptions: string[];
    let correctIndex: number;

    if (draftType === "tf") {
      nonEmptyOptions = [...TF_OPTIONS];
      correctIndex = draftCorrect === 1 ? 1 : 0;
    } else {
      const trimmedOptions = draftOptions.map((option) => option.trim());
      nonEmptyOptions = trimmedOptions.filter((option) => Boolean(option));
      if (nonEmptyOptions.length < MIN_MC_OPTIONS) return;

      correctIndex = -1;
      let nonEmptyCount = 0;
      for (let i = 0; i < trimmedOptions.length; i++) {
        if (!trimmedOptions[i]) continue;
        if (i === draftCorrect) correctIndex = nonEmptyCount;
        nonEmptyCount++;
      }
      if (correctIndex < 0) return;
    }

    if (editingId) {
      await db.transact(
        db.tx.questions[editingId].update({
          text: draftText.trim(),
          options: nonEmptyOptions,
          correctIndex,
          questionType: draftType,
        }),
      );
    } else {
      const questionId = id();
      await db.transact(
        db.tx.questions[questionId]
          .update({
            text: draftText.trim(),
            options: nonEmptyOptions,
            correctIndex,
            order: questions.length,
            questionType: draftType,
          })
          .link({ deck: deck.id }),
      );
    }

    resetDraft();
  };

  const handleEdit = (questionId: string) => {
    const question = questions.find((item) => item.id === questionId);
    if (!question) return;
    const type = parseQuestionType(question.questionType);
    setEditingId(questionId);
    setDraftText(question.text);
    setDraftType(type);

    const existingOptions = Array.isArray(question.options)
      ? (question.options as string[])
      : [];

    if (type === "tf") {
      setDraftOptions([...TF_OPTIONS]);
      setDraftCorrect(
        question.correctIndex === 1 || existingOptions[0] === "False" ? 1 : 0,
      );
    } else {
      const visibleCount = Math.min(
        MAX_MC_OPTIONS,
        Math.max(INITIAL_MC_OPTIONS, existingOptions.length),
      );
      const nextOptions = [
        ...existingOptions,
        ...createEmptyOptions(visibleCount),
      ].slice(0, visibleCount);
      setDraftOptions(nextOptions);
      setDraftCorrect(
        question.correctIndex >= 0 &&
          question.correctIndex < existingOptions.length
          ? question.correctIndex
          : 0,
      );
    }
  };

  const handleDelete = async (questionId: string) => {
    await db.transact(db.tx.questions[questionId].delete());
    if (editingId === questionId) resetDraft();
  };

  const handleMove = async (questionId: string, direction: -1 | 1) => {
    const index = questions.findIndex((item) => item.id === questionId);
    const swapIndex = index + direction;
    if (index < 0 || swapIndex < 0 || swapIndex >= questions.length) return;

    const current = questions[index];
    const swap = questions[swapIndex];
    await db.transact([
      db.tx.questions[current.id].update({ order: swap.order }),
      db.tx.questions[swap.id].update({ order: current.order }),
    ]);
  };

  if (isLoading) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-muted-foreground">Loading deck...</p>
      </main>
    );
  }

  if (error || !deck) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Deck not found</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link to="/">Back to dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (!isOwner || deck.isBuiltIn) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Cannot edit this deck</CardTitle>
            <CardDescription>
              Built-in decks are read-only. Duplicate questions into your own
              deck from the host dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link to="/">Back to dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-6 py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Badge variant="outline">Quiz builder</Badge>
          <h1 className="mt-2 text-2xl font-semibold">Edit deck</h1>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/">Back</Link>
        </Button>
      </div>

      <DeckDetailsForm key={`details-${deck.id}`} deck={deck} />
      <DeckSettingsForm key={`settings-${deck.id}`} deck={deck} />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {editingId ? "Edit question" : "Add question"}
          </CardTitle>
          <CardDescription>
            Choose Multiple Choice or True or False. Multiple choice questions
            need at least {MIN_MC_OPTIONS} options and can have up to{" "}
            {MAX_MC_OPTIONS}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Question type</Label>
            <Select
              value={draftType}
              onValueChange={(value) =>
                handleTypeChange(value === "tf" ? "tf" : "mc")
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mc">Multiple Choice</SelectItem>
                <SelectItem value="tf">True or False</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="question-text">Question</Label>
            <Textarea
              id="question-text"
              value={draftText}
              onChange={(event) => setDraftText(event.target.value)}
              rows={2}
            />
          </div>

          {draftType === "tf" ? (
            <div className="space-y-3">
              <Label>Correct answer</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {TF_OPTIONS.map((label, index) => (
                  <Button
                    key={label}
                    type="button"
                    variant={draftCorrect === index ? "default" : "outline"}
                    className="justify-start gap-2"
                    onClick={() => setDraftCorrect(index)}
                  >
                    {draftCorrect === index ? (
                      <SquareCheckBig className="size-4" />
                    ) : (
                      <Square className="size-4" />
                    )}
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                At least {MIN_MC_OPTIONS} options are required; you can add up
                to {MAX_MC_OPTIONS}.
              </p>
              {draftOptions.map((option, index) => {
                const isOptionFilled = Boolean(option.trim());

                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor={`option-${index}`}>
                        Option {index + 1}
                      </Label>
                      <div className="flex items-center gap-2">
                        <CorrectOptionButton
                          selected={draftCorrect === index}
                          disabled={!isOptionFilled}
                          onClick={() => setDraftCorrect(index)}
                        />
                        {draftOptions.length > INITIAL_MC_OPTIONS ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleRemoveOption(index)}
                            aria-label={`Remove option ${index + 1}`}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        ) : null}
                      </div>
                    </div>
                    <Input
                      id={`option-${index}`}
                      value={option}
                      onChange={(event) => {
                        const next = [...draftOptions];
                        next[index] = event.target.value;

                        if (
                          index === draftCorrect &&
                          !event.target.value.trim()
                        ) {
                          const firstFilledIndex = next.findIndex((v) =>
                            Boolean(v.trim()),
                          );
                          setDraftCorrect(
                            firstFilledIndex >= 0 ? firstFilledIndex : 0,
                          );
                        }

                        setDraftOptions(next);
                      }}
                    />
                  </div>
                );
              })}
              {draftOptions.length < MAX_MC_OPTIONS ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddOption}
                >
                  <Plus className="size-4" />
                  Add option
                </Button>
              ) : null}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={() => void handleSaveQuestion()}
              disabled={!canSaveQuestion}
            >
              {editingId ? "Update question" : "Add question"}
            </Button>
            {editingId ? (
              <Button variant="outline" onClick={resetDraft}>
                Cancel
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Questions ({questions.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {questions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No questions yet. Add your first question above.
            </p>
          ) : (
            questions.map((question, index) => {
              const type = parseQuestionType(question.questionType);
              return (
                <div
                  key={question.id}
                  className="flex items-start justify-between gap-3 rounded-lg border p-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">
                        {index + 1}. {question.text}
                      </p>
                      <Badge variant="secondary">
                        {type === "tf" ? "True / False" : "Multiple Choice"}
                      </Badge>
                    </div>
                    <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                      {(question.options as string[]).map(
                        (option, optionIndex) => (
                          <li
                            key={optionIndex}
                            className={
                              optionIndex === question.correctIndex
                                ? "font-medium text-foreground"
                                : undefined
                            }
                          >
                            {optionIndex === question.correctIndex ? "✓ " : "· "}
                            {option}
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() => void handleMove(question.id, -1)}
                      disabled={index === 0}
                    >
                      <ArrowUp className="size-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() => void handleMove(question.id, 1)}
                      disabled={index === questions.length - 1}
                    >
                      <ArrowDown className="size-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(question.id)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() => void handleDelete(question.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </main>
  );
}
