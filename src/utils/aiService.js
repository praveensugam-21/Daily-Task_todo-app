// Enhanced AI service for generating diverse motivational messages
// In a real application, this would call an actual AI API

export const generateMotivationalMessage = async (tasks) => {
  // Simulate API delay
  await new Promise((resolve) =>
    setTimeout(resolve, 1500 + Math.random() * 1000)
  );

  // Get yesterday's tasks
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayDate = yesterday.toISOString().split("T")[0];

  const yesterdayTasks = tasks.filter((task) => task.date === yesterdayDate);
  const completedYesterday = yesterdayTasks.filter(
    (task) => task.completed
  ).length;
  const totalYesterday = yesterdayTasks.length;

  // Get today's tasks
  const today = new Date().toISOString().split("T")[0];
  const todayTasks = tasks.filter((task) => task.date === today);
  const completedToday = todayTasks.filter((task) => task.completed).length;
  const totalToday = todayTasks.length;

  // Get user's overall patterns
  const allTasks = tasks.filter((task) => task.date !== today);
  const totalCompleted = allTasks.filter((task) => task.completed).length;
  const totalAll = allTasks.length;
  const overallCompletionRate =
    totalAll > 0 ? (totalCompleted / totalAll) * 100 : 0;

  // Check if this is the first day or if there are no previous tasks
  const isFirstDay = totalAll === 0;
  const hasPreviousTasks = totalYesterday > 0;

  // Generate diverse motivational message
  const message = generateDiverseMessage({
    completedYesterday,
    totalYesterday,
    completedToday,
    totalToday,
    overallCompletionRate,
    totalAll,
    isFirstDay,
    hasPreviousTasks,
  });

  return message;
};

const generateDiverseMessage = ({
  completedYesterday,
  totalYesterday,
  completedToday,
  totalToday,
  overallCompletionRate,
  totalAll,
  isFirstDay,
  hasPreviousTasks,
}) => {
  // If it's the first day or no previous tasks, use special first-time messages
  if (isFirstDay || !hasPreviousTasks) {
    return generateFirstTimeMessage(completedToday, totalToday);
  }

  // Different message categories for users with previous tasks
  const categories = [
    "achievement",
    "encouragement",
    "wisdom",
    "challenge",
    "celebration",
    "reflection",
    "growth",
    "inspiration",
  ];

  const selectedCategory =
    categories[Math.floor(Math.random() * categories.length)];

  let message = "";

  switch (selectedCategory) {
    case "achievement":
      message = generateAchievementMessage(
        completedYesterday,
        totalYesterday,
        completedToday,
        totalToday
      );
      break;
    case "encouragement":
      message = generateEncouragementMessage(
        completedYesterday,
        totalYesterday,
        completedToday,
        totalToday
      );
      break;
    case "wisdom":
      message = generateWisdomMessage(
        completedYesterday,
        totalYesterday,
        overallCompletionRate
      );
      break;
    case "challenge":
      message = generateChallengeMessage(
        completedYesterday,
        totalYesterday,
        completedToday,
        totalToday
      );
      break;
    case "celebration":
      message = generateCelebrationMessage(
        completedYesterday,
        totalYesterday,
        completedToday,
        totalToday
      );
      break;
    case "reflection":
      message = generateReflectionMessage(
        completedYesterday,
        totalYesterday,
        overallCompletionRate
      );
      break;
    case "growth":
      message = generateGrowthMessage(
        completedYesterday,
        totalYesterday,
        overallCompletionRate
      );
      break;
    case "inspiration":
      message = generateInspirationMessage(
        completedYesterday,
        totalYesterday,
        completedToday,
        totalToday
      );
      break;
  }

  // Add contextual encouragement for today
  message += generateTodayContext(completedToday, totalToday, false);

  // Add a diverse quote
  message += `\n\n${getRandomQuote(selectedCategory)}`;

  return message;
};

const generateFirstTimeMessage = (completedToday, totalToday) => {
  const messages = [
    `🎬 **Welcome to Your Productivity Journey!** This is the beginning of something amazing. Every great story starts with a single step, and you've just taken yours. Let's make today the first chapter of your success story!`,

    `🌟 **Your Adventure Begins Now!** Welcome to the world of organized productivity! You're about to discover the incredible feeling of checking off tasks and watching your goals come to life. Ready to start your transformation?`,

    `🚀 **Launch Sequence Initiated!** Welcome aboard! You're about to experience the power of focused productivity. Every task you complete will be a rocket booster propelling you toward your dreams. Let's blast off!`,

    `🎨 **Blank Canvas Awaits!** Welcome to your personal productivity studio! Today is your first opportunity to paint the masterpiece of your organized life. What will you create?`,

    `💫 **Magic Begins Here!** Welcome to the world where dreams become plans and plans become reality! You're about to discover the secret sauce of successful people - organized action. Let's make some magic!`,

    `🏆 **Champion in Training!** Welcome to your productivity dojo! You're about to learn the ancient art of task mastery. Every completed task will be a belt promotion in your journey to black belt productivity!`,

    `🌱 **Seeds of Success Planted!** Welcome to your personal growth garden! Today you're planting the seeds of productivity that will grow into a forest of achievements. Let's nurture these seeds together!`,

    `🎪 **Your Greatest Show Begins!** Welcome to the circus of success! You're the star performer, and every task is your act. The audience (your future self) is waiting for an amazing performance. Let's put on a show!`,
  ];

  const selectedMessage = messages[Math.floor(Math.random() * messages.length)];

  // Add today's context
  let context = "";
  if (totalToday === 0) {
    context =
      "\n\n📝 **Ready to Start!** No tasks planned yet. This is your moment to design the perfect day. What would you like to accomplish?";
  } else if (completedToday === totalToday && totalToday > 0) {
    context =
      "\n\n🔥 **First Day Perfection!** You've already completed all your planned tasks! This is what excellence looks like from day one!";
  } else if (completedToday > 0) {
    context = `\n\n⚡ **First Day Momentum!** You've already completed ${completedToday}/${totalToday} tasks today. You're a natural at this!`;
  } else {
    context = `\n\n🎯 **First Mission!** You have ${totalToday} task${
      totalToday > 1 ? "s" : ""
    } planned for today. Your productivity journey starts now!`;
  }

  // Add a special first-time quote
  const firstTimeQuotes = [
    '"The journey of a thousand miles begins with one step." - Lao Tzu',
    '"Every expert was once a beginner." - Robert T. Kiyosaki',
    '"The only impossible journey is the one you never begin." - Tony Robbins',
    '"Start where you are. Use what you have. Do what you can." - Arthur Ashe',
    '"The first step towards getting somewhere is to decide you\'re not going to stay where you are." - J.P. Morgan',
  ];

  const quote =
    firstTimeQuotes[Math.floor(Math.random() * firstTimeQuotes.length)];

  return selectedMessage + context + `\n\n"${quote}"`;
};

const generateAchievementMessage = (
  completedYesterday,
  totalYesterday,
  completedToday,
  totalToday
) => {
  const messages = [
    `🎯 **Outstanding Performance!** You completed ${completedYesterday}/${totalYesterday} tasks yesterday. That's a ${Math.round(
      (completedYesterday / totalYesterday) * 100
    )}% success rate! Your consistency is building an unstoppable momentum.`,

    `🏆 **Excellence Achieved!** ${completedYesterday}/${totalYesterday} tasks conquered yesterday. You're not just completing tasks - you're building a legacy of productivity and determination.`,

    `⭐ **Star Performer!** With ${completedYesterday}/${totalYesterday} tasks completed yesterday, you're proving that excellence is a habit, not an act. Keep shining!`,

    `💪 **Powerhouse Performance!** ${completedYesterday}/${totalYesterday} tasks done yesterday. You're showing the world what focused determination looks like in action.`,

    `🚀 **Rocket Fuel!** ${completedYesterday}/${totalYesterday} tasks completed yesterday. You're not just moving forward - you're accelerating toward your goals!`,
  ];

  return messages[Math.floor(Math.random() * messages.length)];
};

const generateEncouragementMessage = (
  completedYesterday,
  totalYesterday,
  completedToday,
  totalToday
) => {
  const messages = [
    `🌟 **You've Got This!** Every task you complete is a step toward your dreams. Yesterday's ${completedYesterday}/${totalYesterday} completed tasks show your growing strength. Today is your canvas - paint it with purpose!`,

    `💫 **Believe in Yourself!** You completed ${completedYesterday}/${totalYesterday} tasks yesterday. That's not just productivity - that's proof of your capability. Today, let's build on that foundation!`,

    `✨ **Your Potential is Limitless!** ${completedYesterday}/${totalYesterday} tasks conquered yesterday. You're discovering that you're capable of more than you ever imagined. Keep pushing those boundaries!`,

    `🌅 **New Day, New Possibilities!** Yesterday's ${completedYesterday}/${totalYesterday} completed tasks are your stepping stones. Today, let's create even more victories together!`,

    `🎪 **You're the Star of Your Show!** ${completedYesterday}/${totalYesterday} tasks completed yesterday. Your dedication is the script, your actions are the performance, and success is your standing ovation!`,
  ];

  return messages[Math.floor(Math.random() * messages.length)];
};

const generateWisdomMessage = (
  completedYesterday,
  totalYesterday,
  overallCompletionRate
) => {
  const messages = [
    `🧠 **Wisdom in Action:** "The difference between try and triumph is just a little umph!" Yesterday's ${completedYesterday}/${totalYesterday} completed tasks show you understand this truth. Your persistence is your power.`,

    `📚 **Ancient Wisdom Meets Modern Success:** The great philosopher Aristotle said, "We are what we repeatedly do. Excellence, then, is not an act, but a habit." Your ${completedYesterday}/${totalYesterday} completed tasks yesterday prove you're building that habit.`,

    `🎓 **Life Lesson Learned:** Success isn't about perfection - it's about progress. Your ${completedYesterday}/${totalYesterday} completed tasks yesterday show you're making real progress. That's wisdom in action!`,

    `🔮 **The Oracle Speaks:** "The best time to plant a tree was 20 years ago. The second best time is now." Your ${completedYesterday}/${totalYesterday} completed tasks yesterday show you understand the power of now.`,

    `💎 **Diamond Wisdom:** Pressure creates diamonds. Your consistent completion of ${completedYesterday}/${totalYesterday} tasks yesterday shows you're turning life's pressure into beautiful achievements.`,
  ];

  return messages[Math.floor(Math.random() * messages.length)];
};

const generateChallengeMessage = (
  completedYesterday,
  totalYesterday,
  completedToday,
  totalToday
) => {
  const messages = [
    `🔥 **Challenge Accepted!** Yesterday you conquered ${completedYesterday}/${totalYesterday} tasks. Today, I challenge you to push even harder. Can you beat yesterday's record? The only limit is the one you set for yourself!`,

    `⚡ **Level Up Challenge!** ${completedYesterday}/${totalYesterday} tasks completed yesterday. Impressive! But here's your challenge: today, let's aim for even more. Your potential is unlimited - let's discover it together!`,

    `🎯 **Mission Impossible?** You completed ${completedYesterday}/${totalYesterday} tasks yesterday. Today's mission: exceed your own expectations. Ready to prove that impossible is just a word?`,

    `🏔️ **Mountain Climber!** Yesterday you scaled ${completedYesterday}/${totalYesterday} task peaks. Today's challenge: reach even higher. The view from the top is worth every step!`,

    `🚀 **Rocket Challenge!** ${completedYesterday}/${totalYesterday} tasks conquered yesterday. Today's mission: launch into even greater productivity. Your rocket is fueled and ready - time to blast off!`,
  ];

  return messages[Math.floor(Math.random() * messages.length)];
};

const generateCelebrationMessage = (
  completedYesterday,
  totalYesterday,
  completedToday,
  totalToday
) => {
  const messages = [
    `🎉 **Party Time!** ${completedYesterday}/${totalYesterday} tasks completed yesterday! That's worth celebrating! You're not just checking off boxes - you're creating a life of achievement. Let's dance with joy!`,

    `🎊 **Victory Dance!** ${completedYesterday}/${totalYesterday} tasks conquered yesterday! Your success deserves a celebration. You're proving that every small win is a step toward greatness!`,

    `🏅 **Medal Ceremony!** Congratulations on completing ${completedYesterday}/${totalYesterday} tasks yesterday! You've earned your place on the podium of productivity. The gold medal of achievement is yours!`,

    `🎪 **Circus of Success!** ${completedYesterday}/${totalYesterday} tasks completed yesterday! You're the star performer in the greatest show on earth - your life! Let's celebrate this amazing performance!`,

    `🌟 **Star Celebration!** ${completedYesterday}/${totalYesterday} tasks conquered yesterday! You're shining brighter than ever. Time to celebrate this stellar performance and prepare for an even brighter tomorrow!`,
  ];

  return messages[Math.floor(Math.random() * messages.length)];
};

const generateReflectionMessage = (
  completedYesterday,
  totalYesterday,
  overallCompletionRate
) => {
  const messages = [
    `🔍 **Mirror of Achievement:** Looking back at yesterday's ${completedYesterday}/${totalYesterday} completed tasks, what do you see? I see a person who's learning, growing, and becoming stronger with each passing day.`,

    `📖 **Chapter Review:** Yesterday's ${completedYesterday}/${totalYesterday} completed tasks are now part of your story. Every task completed is a sentence written in the book of your success. What will today's chapter bring?`,

    `🎭 **Life's Theater:** Yesterday you performed ${completedYesterday}/${totalYesterday} acts of productivity. Each completed task was a scene in your masterpiece. Today, let's write another beautiful act!`,

    `🌊 **Ocean of Progress:** Your ${completedYesterday}/${totalYesterday} completed tasks yesterday are like waves in the ocean of your potential. Each wave builds momentum for the next. You're creating a powerful current of success!`,

    `🎨 **Art of Living:** Yesterday's ${completedYesterday}/${totalYesterday} completed tasks are brushstrokes on the canvas of your life. You're creating a masterpiece of productivity and purpose.`,
  ];

  return messages[Math.floor(Math.random() * messages.length)];
};

const generateGrowthMessage = (
  completedYesterday,
  totalYesterday,
  overallCompletionRate
) => {
  const messages = [
    `🌱 **Growth Mindset in Action!** Your ${completedYesterday}/${totalYesterday} completed tasks yesterday show you're not just doing - you're becoming. Every task is fertilizer for your personal growth garden!`,

    `📈 **Upward Trajectory!** ${completedYesterday}/${totalYesterday} tasks completed yesterday. You're not just maintaining - you're evolving. Your growth curve is pointing straight to the stars!`,

    `🦋 **Transformation in Progress!** Yesterday's ${completedYesterday}/${totalYesterday} completed tasks are your cocoon of change. You're emerging as a more capable, confident version of yourself!`,

    `🌳 **Roots of Success!** Your ${completedYesterday}/${totalYesterday} completed tasks yesterday are strengthening your foundation. You're building roots that will support your future achievements!`,

    `🚀 **Evolution Accelerated!** ${completedYesterday}/${totalYesterday} tasks conquered yesterday. You're not just growing - you're evolving at warp speed. The future you is becoming the present you!`,
  ];

  return messages[Math.floor(Math.random() * messages.length)];
};

const generateInspirationMessage = (
  completedYesterday,
  totalYesterday,
  completedToday,
  totalToday
) => {
  const messages = [
    `💫 **Inspiration Station!** Your ${completedYesterday}/${totalYesterday} completed tasks yesterday are inspiring others to believe in their own potential. You're not just achieving - you're becoming an inspiration!`,

    `🌟 **Light Bearer!** ${completedYesterday}/${totalYesterday} tasks completed yesterday. You're not just completing tasks - you're lighting the way for others. Your dedication is a beacon of hope and possibility!`,

    `🎭 **Inspiration in Motion!** Yesterday's ${completedYesterday}/${totalYesterday} completed tasks are your performance on life's stage. You're inspiring everyone watching to believe in the power of persistence!`,

    `🔥 **Fire Starter!** Your ${completedYesterday}/${totalYesterday} completed tasks yesterday are sparks that could ignite a wildfire of motivation in others. You're showing the world what's possible!`,

    `🌈 **Rainbow of Possibility!** ${completedYesterday}/${totalYesterday} tasks conquered yesterday. You're painting the sky with colors of achievement that inspire others to reach for their own rainbows!`,
  ];

  return messages[Math.floor(Math.random() * messages.length)];
};

const generateTodayContext = (completedToday, totalToday, isFirstDay) => {
  if (isFirstDay) {
    return "\n\n🎬 **Your Story Begins Today!** This is the first page of your productivity journey. Every great adventure starts with a single step. You're about to write an amazing story!";
  }

  if (totalToday === 0) {
    return "\n\n📝 **Blank Canvas Awaits!** No tasks planned for today yet. This is your opportunity to design the perfect day. What will you create?";
  }

  if (completedToday === totalToday && totalToday > 0) {
    return "\n\n🔥 **On Fire Today!** You've already completed all your planned tasks! You're not just meeting expectations - you're exceeding them. This is what excellence looks like!";
  }

  if (completedToday > 0) {
    return `\n\n⚡ **Momentum Building!** You've already completed ${completedToday}/${totalToday} tasks today. You're building unstoppable momentum. Keep this energy flowing!`;
  }

  return `\n\n🎯 **Ready to Launch!** You have ${totalToday} task${
    totalToday > 1 ? "s" : ""
  } planned for today. The countdown is over - it's time to blast off into productivity!`;
};

const getRandomQuote = (category) => {
  const quotes = {
    achievement: [
      '"Success is not final, failure is not fatal: it is the courage to continue that counts." - Winston Churchill',
      '"The only way to do great work is to love what you do." - Steve Jobs',
      '"Achievement is not always about greatness. It\'s about consistency." - Dwayne Johnson',
      '"Success is walking from failure to failure with no loss of enthusiasm." - Winston Churchill',
      '"The future depends on what you do today." - Mahatma Gandhi',
    ],
    encouragement: [
      '"Believe you can and you\'re halfway there." - Theodore Roosevelt',
      '"You are never too old to set another goal or to dream a new dream." - C.S. Lewis',
      '"The only limit to our realization of tomorrow is our doubts of today." - Franklin D. Roosevelt',
      '"Don\'t watch the clock; do what it does. Keep going." - Sam Levenson',
      '"It always seems impossible until it\'s done." - Nelson Mandela',
    ],
    wisdom: [
      '"The journey of a thousand miles begins with one step." - Lao Tzu',
      '"Wisdom comes from experience, and experience comes from mistakes." - Unknown',
      '"The only true wisdom is in knowing you know nothing." - Socrates',
      '"Knowledge speaks, but wisdom listens." - Jimi Hendrix',
      '"The fool doth think he is wise, but the wise man knows himself to be a fool." - William Shakespeare',
    ],
    challenge: [
      '"The greater the obstacle, the more glory in overcoming it." - Molière',
      '"Challenges are what make life interesting and overcoming them is what makes life meaningful." - Joshua J. Marine',
      "\"I have not failed. I've just found 10,000 ways that won't work.\" - Thomas Edison",
      '"The only way to achieve the impossible is to believe it is possible." - Charles Kingsleigh',
      '"When we least expect it, life sets us a challenge to test our courage and willingness to change." - Paulo Coelho',
    ],
    celebration: [
      '"Celebrate what you\'ve accomplished, but raise the bar a little higher each time you succeed." - Mia Hamm',
      '"Success is not the key to happiness. Happiness is the key to success." - Albert Schweitzer',
      '"The more you praise and celebrate your life, the more there is in life to celebrate." - Oprah Winfrey',
      '"Celebrate your success and stand strong when adversity hits." - K. Weikel',
      '"Every day is a new beginning. Take a deep breath and start again." - Unknown',
    ],
    reflection: [
      '"Life can only be understood backwards; but it must be lived forwards." - Søren Kierkegaard',
      '"Reflection is the lamp of the heart. If it departs, the heart will have no light." - Abdullah ibn Alawi al-Haddad',
      '"We do not learn from experience... we learn from reflecting on experience." - John Dewey',
      '"The unexamined life is not worth living." - Socrates',
      '"Look back and be grateful, look ahead and be hopeful, look around and be helpful." - Unknown',
    ],
    growth: [
      '"Growth is the only evidence of life." - John Henry Newman',
      '"The only person you are destined to become is the person you decide to be." - Ralph Waldo Emerson',
      '"Personal growth is not a matter of learning new information but of unlearning old limits." - Alan Cohen',
      '"Change is the end result of all true learning." - Leo Buscaglia',
      '"Growth and comfort do not coexist." - Ginni Rometty',
    ],
    inspiration: [
      '"Be the change you wish to see in the world." - Mahatma Gandhi',
      '"In a gentle way, you can shake the world." - Mahatma Gandhi',
      '"The best way to predict the future is to create it." - Peter Drucker',
      '"Inspiration exists, but it has to find you working." - Pablo Picasso',
      '"What you get by achieving your goals is not as important as what you become by achieving your goals." - Zig Ziglar',
    ],
  };

  const categoryQuotes = quotes[category] || quotes.encouragement;
  return categoryQuotes[Math.floor(Math.random() * categoryQuotes.length)];
};

// For development/testing purposes, you can also use this simpler version
export const generateSimpleMessage = async (tasks) => {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const today = new Date().toISOString().split("T")[0];
  const todayTasks = tasks.filter((task) => task.date === today);
  const completed = todayTasks.filter((task) => task.completed).length;
  const total = todayTasks.length;

  if (total === 0) {
    return "Welcome! Add some tasks to get started on your productive journey! 🚀";
  } else if (completed === total) {
    return "Amazing! You've completed all your tasks for today! 🎉 Keep up the excellent work!";
  } else {
    return `Great progress! You've completed ${completed} of ${total} tasks today. Keep going! 💪`;
  }
};
