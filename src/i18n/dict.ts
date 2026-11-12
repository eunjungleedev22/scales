export const DICT = {
  en: {
    appName: "Harmonic Cat",
    nav_dashboard: "Home", nav_learn: "Learn", nav_practice: "Practice", nav_ear: "Ear Training", nav_playground: "Playground", nav_lab: "Composition Lab", nav_reflect: "Reflect", nav_progress: "Progress", nav_settings: "Settings",
    continue: "Continue learning", startLearning: "Start learning", currentWorld: "Current world", skillMastery: "Skill mastery", quickPractice: "Quick practice", deepDive: "Deep Dive Mode", openLab: "Open Composition Lab",
    check: "Check", clear: "Clear", hint: "Hint", replay: "Replay", play: "Play", stop: "Stop", next: "Next", retry: "Try again", skip: "Skip", finish: "Finish", listen: "Listen",
    why: "Why it works", inTheStudio: "In the studio", lessonComplete: "Lesson complete!", bossDefeated: "Boss defeated!", xpEarned: "XP earned", backToMap: "Back to map", nextLesson: "Next lesson",
    level: "Level", xp: "XP", worldComplete: "complete", recommended: "Next up", done: "Done", testedOut: "Skipped", boss: "Boss",
    tapForSound: "Tap to enable sound", soundOn: "Sound ready", loadingAudio: "Loading audio…", audioError: "Audio couldn't start. Tap again or check your device volume.",
    focusMode: "Focus mode", exitFocus: "Exit focus", placementTest: "Placement test", review: "Review challenge", achievements: "Achievements",
    concept: "Concept", demo: "Demo", shortcuts: "Shortcuts", selected: "Selected", yourAnswer: "Your answer", original: "Original", revised: "Your version",
    correctFirstTry: "first try", loading: "Loading…", noReviewYet: "Nothing to review yet — do a few lessons first.", minutes: "min",
    language: "Language", showNoteNames: "Show note names", solfege: "Solfège labels", preferFlats: "Prefer flats (Db, Eb…)", volume: "Volume", reducedMotion: "Reduce motion", breakReminder: "Gentle break reminder", resetProgress: "Reset all progress", off: "off",
  },
  ko: {
    appName: "하모닉 캣",
    nav_dashboard: "홈", nav_learn: "학습", nav_practice: "연습", nav_ear: "청음 훈련", nav_playground: "이론 놀이터", nav_lab: "작곡 랩", nav_reflect: "회고", nav_progress: "진행 상황", nav_settings: "설정",
    continue: "이어서 학습", startLearning: "학습 시작", currentWorld: "현재 월드", skillMastery: "스킬 숙련도", quickPractice: "빠른 연습", deepDive: "딥 다이브 모드", openLab: "작곡 랩 열기",
    check: "확인", clear: "지우기", hint: "힌트", replay: "다시 듣기", play: "재생", stop: "정지", next: "다음", retry: "다시 시도", skip: "건너뛰기", finish: "완료", listen: "듣기",
    why: "왜 그럴까요", inTheStudio: "스튜디오에서", lessonComplete: "레슨 완료!", bossDefeated: "보스 격파!", xpEarned: "획득 XP", backToMap: "지도로", nextLesson: "다음 레슨",
    level: "레벨", xp: "XP", worldComplete: "완료", recommended: "다음 추천", done: "완료", testedOut: "건너뜀", boss: "보스",
    tapForSound: "탭하여 소리 켜기", soundOn: "소리 준비됨", loadingAudio: "오디오 로딩 중…", audioError: "오디오를 시작할 수 없어요. 다시 탭하거나 볼륨을 확인하세요.",
    focusMode: "집중 모드", exitFocus: "집중 모드 종료", placementTest: "배치 고사", review: "복습 챌린지", achievements: "업적",
    concept: "개념", demo: "데모", shortcuts: "단축키", selected: "선택됨", yourAnswer: "내 답", original: "원본", revised: "내 버전",
    correctFirstTry: "한 번에", loading: "로딩 중…", noReviewYet: "아직 복습할 내용이 없어요 — 레슨을 먼저 해보세요.", minutes: "분",
    language: "언어", showNoteNames: "음 이름 표시", solfege: "계이름 표시", preferFlats: "플랫 표기 선호 (Db, Eb…)", volume: "볼륨", reducedMotion: "모션 줄이기", breakReminder: "휴식 알림", resetProgress: "진행 상황 초기화", off: "끔",
  },
} as const;

export type DictKey = keyof (typeof DICT)["en"];
