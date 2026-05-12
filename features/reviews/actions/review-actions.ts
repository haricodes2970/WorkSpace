"use server";

import { requireSession } from "@/lib/auth/get-session";
import {
  getStrategicReviews,
  getStrategicReview,
  createStrategicReview,
  generateReviewPreview,
} from "../review.service";
import type {
  StrategicReviewRecord,
  StrategicReviewKind,
  CreateStrategicReviewInput,
  ReviewAnalysis,
} from "../types";
import { revalidatePath } from "next/cache";

export async function getStrategicReviewsAction(
  type?: StrategicReviewKind
): Promise<StrategicReviewRecord[]> {
  const { profile } = await requireSession();
  return getStrategicReviews(profile.id, type);
}

export async function getStrategicReviewAction(
  id: string
): Promise<StrategicReviewRecord | null> {
  const { profile } = await requireSession();
  return getStrategicReview(id, profile.id);
}

export async function generateReviewPreviewAction(
  periodType:  StrategicReviewKind,
  periodStart: string,
  periodEnd:   string,
  period:      string
): Promise<ReviewAnalysis> {
  const { profile } = await requireSession();
  return generateReviewPreview(
    profile.id,
    periodType,
    new Date(periodStart),
    new Date(periodEnd),
    period
  );
}

export async function createStrategicReviewAction(
  input: Omit<CreateStrategicReviewInput, "periodStart" | "periodEnd"> & {
    periodStart: string;
    periodEnd:   string;
  }
): Promise<StrategicReviewRecord> {
  const { profile } = await requireSession();
  const record = await createStrategicReview(profile.id, {
    ...input,
    periodStart: new Date(input.periodStart),
    periodEnd:   new Date(input.periodEnd),
  });
  revalidatePath("/reviews");
  return record;
}
