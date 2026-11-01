/**
 * Interface text for the public site. "כתבה" is the one word for an article, and
 * instructions use the plural imperative, which addresses everyone.
 */
export const copy = {
  site: {
    title: "חטיבון - עיתון בית הספר",
    description: "עיתון בית הספר של חטיבת הביניים. כתבות, סיפורים ודעות מהתלמידים והמורים.",
    credit: "נבנה על ידי רני מלאך",
  },
  nav: {
    main: "ניווט ראשי",
    skipToContent: "דילוג לתוכן",
    home: "לדף הבית",
    issues: "גיליונות",
    search: "חיפוש",
    write: "כתיבה",
    schedule: "מערכת שעות",
    themeToDark: "מעבר למצב כהה",
    themeToLight: "מעבר למצב בהיר",
  },
  issue: {
    empty: "עדיין לא פורסמו כתבות.",
    issuesTitle: "גיליונות",
    articleCount: (count: number) =>
      count === 1 ? "כתבה אחת" : `${count} כתבות`,
  },
  print: {
    link: "הדפסת הגיליון",
    button: "הדפסה",
    title: (label: string, year: number) => `הדפסת גיליון ${label} ${year}`,
  },
  article: {
    byline: (name: string) => `מאת ${name}`,
    deletedAuthor: "(נמחק)",
    grade: (grade: string, classNumber: number) => `כיתה ${grade}${classNumber}`,
    readingTime: (minutes: number) => `${minutes} דק׳ קריאה`,
    wordCount: (count: number) => `${count} מילים`,
    backToIssue: (label: string) => `לגיליון ${label}`,
    guestAuthor: "כותב אורח",
    imageFallbackAlt: "תמונה בכתבה",
  },
  labels: {
    teacher: "כתבה של מורה",
    creator: "יוצר האתר",
    aiImage: "תמונת AI",
  },
  errors: {
    notFoundTitle: "הדף לא נמצא",
    notFoundBody: "ייתכן שהכתובת השתנתה או שהכתבה הוסרה.",
    articleNotFound: "הכתבה לא נמצאה",
    failedTitle: "משהו השתבש",
    failedBody: "לא הצלחנו לטעון את הדף. נסו שוב בעוד רגע.",
    retry: "ניסיון נוסף",
  },
} as const;
