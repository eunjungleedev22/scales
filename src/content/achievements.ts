import type { Localized } from "@/lib/exercises/types";

export interface Achievement {
  id: string;
  emoji: string;
  title: Localized;
  description: Localized;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first-purr", emoji: "😺", title: { en: "First Purr", ko: "첫 골골송" }, description: { en: "Answer your first exercise correctly.", ko: "첫 문제를 맞혔어요." } },
  { id: "whisker-perfect", emoji: "✨", title: { en: "Whisker Perfect", ko: "완벽한 수염" }, description: { en: "Finish a lesson with every answer right on the first try.", ko: "레슨을 모두 한 번에 맞혔어요." } },
  { id: "nine-lives", emoji: "🐈‍⬛", title: { en: "Nine Lives", ko: "아홉 개의 목숨" }, description: { en: "Get an exercise right after missing it — persistence pays.", ko: "틀린 문제를 다시 맞혔어요." } },
  { id: "big-cat", emoji: "🐯", title: { en: "Big Cat", ko: "큰 고양이" }, description: { en: "Defeat your first boss challenge.", ko: "첫 보스를 이겼어요." } },
  { id: "golden-ears", emoji: "👂", title: { en: "Golden Ears", ko: "황금 귀" }, description: { en: "10 ear-training answers right in a row.", ko: "청음 10연속 정답." } },
  { id: "curious-cat", emoji: "🔭", title: { en: "Curious Cat", ko: "호기심 많은 고양이" }, description: { en: "Explore 10 different scales or chords in the Playground.", ko: "놀이터에서 스케일/코드 10개 탐험." } },
  { id: "acid-kitty", emoji: "🧪", title: { en: "Acid Kitty", ko: "애시드 키티" }, description: { en: "Write your first bassline.", ko: "첫 베이스라인을 만들었어요." } },
  { id: "midnight-export", emoji: "💾", title: { en: "Midnight Export", ko: "자정의 내보내기" }, description: { en: "Export a MIDI file for Ableton.", ko: "Ableton용 MIDI를 내보냈어요." } },
  { id: "long-nap", emoji: "😴", title: { en: "Long Nap, Fresh Ears", ko: "긴 낮잠, 새로운 귀" }, description: { en: "Come back after a break of 3+ days. Breaks are part of learning!", ko: "3일 이상 쉬고 돌아왔어요. 휴식도 학습이에요!" } },
  { id: "deep-diver", emoji: "🌊", title: { en: "Deep Diver", ko: "딥 다이버" }, description: { en: "Spend 60 minutes in one Deep Dive session.", ko: "딥 다이브 60분." } },
  { id: "night-prowler", emoji: "🌙", title: { en: "Night Prowler", ko: "밤의 사냥꾼" }, description: { en: "Practise after midnight like a true raver.", ko: "자정 넘어 연습했어요." } },
  { id: "skip-ahead", emoji: "🚀", title: { en: "Already Knew That", ko: "이미 알아요" }, description: { en: "Test out of material with the placement test.", ko: "배치 고사로 건너뛰었어요." } },
  { id: "world-1", emoji: "🎹", title: { en: "Key Cat", ko: "건반 고양이" }, description: { en: "Complete World 1.", ko: "월드 1 완료." } },
  { id: "world-2", emoji: "🪜", title: { en: "Scale Climber", ko: "스케일 등반가" }, description: { en: "Complete World 2.", ko: "월드 2 완료." } },
  { id: "world-3", emoji: "🎛️", title: { en: "Catnip Chords", ko: "캣닢 코드" }, description: { en: "Complete World 3.", ko: "월드 3 완료." } },
  { id: "composer", emoji: "🎼", title: { en: "Composer Cat", ko: "작곡가 고양이" }, description: { en: "Build a progression, bassline and melody in the Lab.", ko: "랩에서 진행, 베이스, 멜로디를 모두 만들었어요." } },
];
