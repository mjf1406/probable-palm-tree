/** @format */

import { useState } from "react";
import QRCode from "react-qr-code";
import { Copy, Play, UserMinus, Users } from "lucide-react";
import { toast } from "sonner";
import { GameCodeDisplay } from "@/components/GameCodeDisplay";
import { CancelGameButton } from "@/components/game/CancelGameButton";
import { LeaveGameButton } from "@/components/game/LeaveGameButton";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PlayerAvatar } from "@/components/game/PlayerAvatar";
import { PlayerCustomization } from "@/components/game/PlayerCustomization";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { db } from "@/lib/db";
import { getJoinPageUrl, getJoinUrl } from "@/lib/routes";
import type { PlayerRecord } from "@/lib/types";
import { cn } from "@/lib/utils";

type LobbyViewProps = {
    code: string;
    gameTypeName: string;
    players: PlayerRecord[];
    isHost: boolean;
    currentPlayer?: PlayerRecord | null;
    currentPlayerNickname?: string;
    onStart: () => void;
    onLeave?: () => void;
    onCancel?: () => void;
    isLeaving?: boolean;
    isCancelling?: boolean;
};

export function LobbyView({
    code,
    gameTypeName,
    players,
    isHost,
    currentPlayer,
    currentPlayerNickname,
    onStart,
    onLeave,
    onCancel,
    isLeaving = false,
    isCancelling = false,
}: LobbyViewProps) {
    const [kickTarget, setKickTarget] = useState<PlayerRecord | null>(null);
    const [isKicking, setIsKicking] = useState(false);

    const handleCopyCode = async () => {
        await navigator.clipboard.writeText(code);
        toast.success("Join code copied!");
    };

    const handleCopyLink = async () => {
        await navigator.clipboard.writeText(getJoinUrl(code));
        toast.success("Join link copied!");
    };

    const handleKick = async () => {
        if (!kickTarget) return;
        setIsKicking(true);
        try {
            await db.transact(db.tx.players[kickTarget.id].delete());
            toast.success(`${kickTarget.nickname} was removed from the lobby.`);
            setKickTarget(null);
        } catch {
            toast.error("Could not remove player. Try again.");
        } finally {
            setIsKicking(false);
        }
    };

    if (isHost) {
        return (
            <>
                <main className="w-full px-6 py-10">
                    <div className="mb-6 space-y-2">
                        <Badge variant="secondary">{gameTypeName}</Badge>
                        <h1 className="text-3xl font-semibold tracking-tight">
                            Game lobby
                        </h1>
                        <p className="text-muted-foreground">
                            Share the code or QR so players can join at{" "}
                            <span className="font-mono text-foreground">
                                /join
                            </span>
                            .
                        </p>
                    </div>

                    <div className="grid gap-6 xl:grid-cols-2">
                        <Card className="border-primary/20">
                            <CardHeader className="items-stretch">
                                <CardTitle className="text-xl">
                                    How to join
                                </CardTitle>
                                <CardDescription className="text-base leading-relaxed">
                                    Players should open the join page, enter
                                    this code, pick a nickname, then choose your
                                    icon and color in the lobby.
                                </CardDescription>
                                <CardAction className="flex self-stretch">
                                    <Button
                                        size="lg"
                                        className="h-full min-w-[33cqw] text-2xl font-bold rounded-4xl"
                                        onClick={onStart}
                                        disabled={players.length === 0}
                                    >
                                        <Play className="size-10 mr-2" />
                                        Start game
                                    </Button>
                                </CardAction>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-6 lg:grid-cols-2">
                                    <div className="space-y-6">
                                        <ol className="space-y-3 text-2xl text-muted-foreground">
                                            <li className="flex gap-3">
                                                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/70 text-lg font-bold text-primary-foreground">
                                                    1
                                                </span>
                                                <span className="rounded-md bg-primary/15 px-2 py-0.5 font-mono font-medium text-foreground">
                                                    {getJoinPageUrl()}
                                                </span>
                                            </li>
                                            <li className="flex gap-3">
                                                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/70 text-lg font-bold text-primary-foreground">
                                                    2
                                                </span>
                                                Enter the join code.
                                            </li>
                                            <li className="flex gap-3">
                                                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/70 text-lg font-bold text-primary-foreground">
                                                    3
                                                </span>
                                                Type in your nickname.
                                            </li>
                                            <li className="flex gap-3">
                                                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/70 text-lg font-bold text-primary-foreground">
                                                    4
                                                </span>
                                                Pick an icon and color in the
                                                lobby.
                                            </li>
                                        </ol>

                                        <div className="space-y-3">
                                            <p className="text-sm font-medium text-muted-foreground">
                                                Join code
                                            </p>
                                            <GameCodeDisplay
                                                code={code}
                                                size="xl"
                                            />
                                            <div className="flex flex-wrap gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        void handleCopyCode()
                                                    }
                                                >
                                                    <Copy className="size-4" />
                                                    Copy code
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        void handleCopyLink()
                                                    }
                                                >
                                                    <Copy className="size-4" />
                                                    Copy join link
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-1 items-center justify-center p-2">
                                        <QRCode
                                            value={getJoinUrl(code)}
                                            size={320}
                                            bgColor="transparent"
                                            fgColor="currentColor"
                                            className="h-auto w-full max-w-[320px] text-foreground"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <Users className="size-5" />
                                    Players ({players.length})
                                </CardTitle>
                                <CardDescription>
                                    Tap a player to remove them from the lobby.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {players.length === 0 ? (
                                    <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                                        <Users className="mb-3 size-10 text-muted-foreground" />
                                        <p className="font-medium">
                                            Waiting for players
                                        </p>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Share the code or QR code to get
                                            your squad in.
                                        </p>
                                    </div>
                                ) : (
                                    <ul className="max-h-128 space-y-2 overflow-y-auto">
                                        {players.map((player) => (
                                            <li key={player.id}>
                                                <button
                                                    type="button"
                                                    className={cn(
                                                        "flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors",
                                                        "hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                                    )}
                                                    onClick={() =>
                                                        setKickTarget(player)
                                                    }
                                                >
                                                    <PlayerAvatar
                                                        nickname={player.nickname}
                                                        iconId={player.iconId}
                                                        avatarColor={
                                                            player.avatarColor
                                                        }
                                                    />
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate font-medium">
                                                            {player.nickname}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            Tap to kick
                                                        </p>
                                                    </div>
                                                    <UserMinus className="size-4 text-muted-foreground" />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {onCancel ? (
                        <div className="mt-6 flex justify-center">
                            <CancelGameButton
                                isCancelling={isCancelling}
                                onCancel={onCancel}
                            />
                        </div>
                    ) : null}
                </main>

                <AlertDialog
                    open={Boolean(kickTarget)}
                    onOpenChange={(open) => {
                        if (!open) setKickTarget(null);
                    }}
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                Kick {kickTarget?.nickname}?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                They will be removed from the lobby and need to
                                re-join with the code to play.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isKicking}>
                                Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                                variant="destructive"
                                disabled={isKicking}
                                onClick={(event) => {
                                    event.preventDefault();
                                    void handleKick();
                                }}
                            >
                                {isKicking ? "Removing..." : "Kick player"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </>
        );
    }

    return (
        <main className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-lg flex-col gap-6 px-6 py-10">
            <Card className="w-full text-center">
                <CardHeader>
                    <Badge
                        variant="secondary"
                        className="mx-auto w-fit"
                    >
                        {gameTypeName}
                    </Badge>
                    <CardTitle className="text-2xl">
                        You&apos;re in, {currentPlayerNickname}!
                    </CardTitle>
                    <CardDescription>
                        {currentPlayerNickname ? (
                            <>
                                Playing as{" "}
                                <span className="font-medium text-foreground">
                                    {currentPlayerNickname}
                                </span>
                            </>
                        ) : (
                            "Waiting for the host to start the game."
                        )}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="rounded-lg border bg-muted/40 px-4 py-6">
                        <p className="text-sm text-muted-foreground">
                            {players.length} player
                            {players.length === 1 ? "" : "s"} in the lobby
                        </p>
                        <div className="mt-3 flex flex-wrap justify-center gap-2">
                            {players.map((player) => (
                                <Badge
                                    key={player.id}
                                    variant={
                                        player.nickname ===
                                        currentPlayerNickname
                                            ? "default"
                                            : "outline"
                                    }
                                    className="gap-1.5"
                                >
                                    <PlayerAvatar
                                        nickname={player.nickname}
                                        iconId={player.iconId}
                                        avatarColor={player.avatarColor}
                                        className="size-5"
                                        iconClassName="size-3"
                                    />
                                    {player.nickname}
                                </Badge>
                            ))}
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Hang tight — the host will start the game soon.
                    </p>
                    {onLeave ? (
                        <LeaveGameButton
                            className="w-full"
                            isLeaving={isLeaving}
                            onLeave={onLeave}
                        />
                    ) : null}
                </CardContent>
            </Card>
            {currentPlayer ? (
                <PlayerCustomization
                    playerId={currentPlayer.id}
                    nickname={currentPlayer.nickname}
                    iconId={currentPlayer.iconId}
                    avatarColor={currentPlayer.avatarColor}
                />
            ) : null}
        </main>
    );
}
