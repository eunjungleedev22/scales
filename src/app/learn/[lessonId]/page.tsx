"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getLesson } from "@/content/curriculum";
import { LessonRunner } from "@/components/exercises/LessonRunner";
import { Cat } from "@/components/mascot/Cat";

export default function LessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const lesson = getLesson(lessonId);
  if (!lesson) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <Cat mood="oops" size={100} />
        <p className="font-bold">That lesson wandered off.</p>
        <Link href="/learn" className="text-lime underline">
          Back to the map
        </Link>
      </div>
    );
  }
  return <LessonRunner key={lesson.id} lesson={lesson} />;
}
