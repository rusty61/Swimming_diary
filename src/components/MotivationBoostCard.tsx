"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card"; // Import Card components

const quotes = [
  { text: "Discipline is just remembering what you want most, not what you want now." },
  { text: "You don’t rise to your goals, you fall to your habits—build better habits." },
  { text: "Tired is a signal, not a stop sign. Listen, adjust, keep moving." },
  { text: "Talent sets the starting line. Work decides the finish time." },
  { text: "Small wins, stacked daily, turn into ‘suddenly’ unstoppable." },
  { text: "The gap between average and elite is measured in boring, repeated effort." },
  { text: "You don’t need to feel motivated, you need to be consistent." },
  { text: "Hard sets end. The pride from finishing them doesn’t." },
  { text: "On days you don’t feel like it, just showing up is a victory." },
  { text: "Pressure means you’re doing something that matters. Breathe and use it." },
  { text: "Recovery isn’t laziness; it’s where the adaptation happens." },
  { text: "Your future self is watching this session. Don’t let them down." },
  { text: "Confidence is built in private work, not public results." },
  { text: "You can’t control the lane next to you, only the stroke in front of you." },
  { text: "Progress hides inside the reps nobody praises and nobody posts." },
  { text: "If it scares you a little, it’s probably worth doing." },
  { text: "Champions don’t always feel ready; they go anyway." },
  { text: "You won’t always love the session, but you’ll always love having done it." },
  { text: "The clock is honest. Train in a way you’re proud of what it says." },
  { text: "Your best races are built from thousands of unremarkable, relentless days." },
  { text: "Tough sessions don’t break you, they reveal the strength you’ve already built." },
  { text: "Consistency beats intensity when intensity only shows up sometimes." },
  { text: "Every rep is a vote for the athlete you want to become." },
  { text: "You don’t have to be perfect; you have to be unavailable for quitting." },
  { text: "The work you hide from is exactly where your next breakthrough lives." },
  { text: "Fatigue is temporary, but the standard you set for yourself sticks." },
  { text: "You’re not starting from zero; you’re starting from experience." },
  { text: "One session won’t make you, but it can move you closer or further. Choose the direction." },
  { text: "Most people stop when it hurts. Progress starts one step after that." },
  { text: "A plateau is just your body asking for patience and persistence, not surrender." },
  { text: "Win the warm-up, win the focus, then win the set." },
  { text: "You don’t need a perfect day, you need a solid next rep." },
  { text: "Self-belief isn’t noise in your head, it’s evidence you’ve earned through work." },
  { text: "When doubt gets loud, let your preparation answer for you." },
  { text: "Slow progress is still progress—quitting is the only flat line." },
  { text: "You earn confidence by keeping promises you make to yourself." },
  { text: "There’s always someone with more talent—make sure there’s no one with more grit." },
  { text: "When you can’t go faster, go cleaner and more precise." },
  { text: "Every time you show up on a hard day, you widen the gap between you and average."},
  { text: "Chase the black line, not the clock." },
  { text: "Tough sets build fast swims." },
  { text: "One more rep. Future you is watching." },
  { text: "Champions finish the last 25." },
  { text: "Breathe in confidence, blow out doubt." },
  { text: "You don’t rise to the meet, you fall to your training." },
  { text: "Every stroke says who you are." },
  { text: "Last lap: pain is temporary, time is permanent." },
  { text: "Relax the face. Attack the water." },
  { text: "Be the first off the wall. Always." },
  { text: "Your only job: win this stroke." },
  { text: "Fast feet, calm mind." },
  { text: "Lane. Line. Focus. That’s your world." },
  { text: "Turn like you mean it." },
  { text: "Nobody cares about tired in the call room." },
  { text: "Trust the work. Just race." },
  { text: "Today’s grind is tomorrow’s PB." },
  { text: "Eyes down, elbows high, no excuses." },
  { text: "Big kicks. Big lungs. Big heart." },
  { text: "You’re fitter than your fear." },
  { text: "Own the first 15m. Own the race." },
  { text: "Don’t wait to feel good. Go now." },
  { text: "You vs. yesterday. That’s it." },
  { text: "Tired is a feeling, fast is a choice." },
  { text: "Sharp start. Ruthless middle. Brave finish." },
  { text: "Pressure = privilege. You earned this." },
  { text: "Hold your water, hold your form." },
  { text: "Think technique, not panic." },
  { text: "Swim the plan, not the nerves." },
  { text: "When it burns, you’re exactly where you need to be." }
];

const MotivationBoostCard: React.FC = () => {
  const [currentQuote, setCurrentQuote] = React.useState(quotes[0]);

  React.useEffect(() => {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    setCurrentQuote(quotes[randomIndex]);
  }, []);

  return (
    <Card className="bg-card text-foreground shadow-md border-card-border p-6 flex items-center justify-center">
      <CardContent className="p-0 text-center">
        <blockquote className="text-xl italic font-extrabold text-text-main opacity-80 leading-tight max-w-3xl">
          "{currentQuote.text}"
        </blockquote>
      </CardContent>
    </Card>
  );
};

export default MotivationBoostCard;