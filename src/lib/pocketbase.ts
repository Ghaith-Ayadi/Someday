import PocketBase, { type RecordModel } from "pocketbase";

// The backend: one PocketBase instance per app on Bedrock (Ghaith-Ayadi/Bedrock).
const url = import.meta.env.VITE_PB_URL;

if (!url) {
    throw new Error("Missing VITE_PB_URL");
}

export const pb = new PocketBase(url);

// Several views fire overlapping list requests. The SDK's default cancels the
// earlier one, which the sync layer would read as a failure.
pb.autoCancellation(false);

export type PbUser = RecordModel & {
    email: string;
    name?: string;
    avatar?: string;
};

/** PocketBase date strings are "YYYY-MM-DD HH:mm:ss.sssZ"; Safari's Date needs the T. */
export function pbDateToMs(value: string | null | undefined): number | null {
    if (!value) return null;
    const ms = Date.parse(value.includes("T") ? value : value.replace(" ", "T"));
    return Number.isNaN(ms) ? null : ms;
}
