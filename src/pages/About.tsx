import React from "react";
import { Beer, Github, Mail } from "lucide-react";
import SparkleWrapper from "../components/Sparkles";

const About: React.FC = () => {
  const upcomingFeatures = [
    [
      "Interactive Planning",
      "refined visit logic with drag-and-drop scheduling",
    ],
    [
      "Mock & Live API Support",
      "seamless switching between test data and real-world accounts",
    ],
    ["Schedule Visualization", "enhanced daily & weekly journey timelines"],
    ["Smart Regeneration", "with filters, rules, and user guidance"],
    ["Expanded Export Tools", "including CSV, PDF, and future mobile sync"],
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="animated-border bg-gradient-to-r from-eggplant-900/90 via-dark-900/95 to-eggplant-900/90 backdrop-blur-sm rounded-lg p-8 mb-8">
        <div className="flex items-center mb-6">
          <Beer className="h-8 w-8 text-neon-blue animate-pulse mr-3" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-neon-purple via-neon-pink to-neon-blue bg-clip-text text-transparent animate-gradient-x">
            About IC Journey Planner
          </h1>
        </div>

        <div className="prose max-w-none">
          <p className="text-lg mb-4 text-white">
            <strong>Built by a field rep, for field reps.</strong> IC Journey
            Planner helps sales professionals optimize their day, boost
            territory performance, and preserve their personal time. Originally
            crafted for the beverage industry, it’s now a powerful tool for any
            rep managing a route or portfolio of accounts.
          </p>

          <div className="animated-border bg-gradient-to-r from-eggplant-800/90 via-dark-800/95 to-eggplant-800/90 backdrop-blur-sm rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-3 text-white">
              What You Can Do
            </h2>
            <ul className="list-none pl-0 space-y-3 mb-6">
              {[
                [
                  "Smart Daily Planning",
                  "Balance 6–8 high-impact visits with location logic and KPIs in mind.",
                ],
                [
                  "Priority-Driven Lists",
                  "Wishlist, unvisited, and master accounts all prioritized dynamically.",
                ],
                [
                  "Location-Smart Routing",
                  "Reduce windshield time and increase face time with optimized routes.",
                ],
                [
                  "Visit History Tracking",
                  "Auto-manage visit frequency and flag overdue accounts.",
                ],
                [
                  "One-Click Excel Export",
                  "Easily share and report your schedules with teammates or managers.",
                ],
                [
                  "Performance Focus",
                  "Deadlines and visit goals built in to keep you on target.",
                ],
              ].map(([title, desc], i) => (
                <li key={i} className="flex items-start">
                  <span className="inline-block w-2 h-2 mt-2 mr-2 rounded-full bg-neon-blue" />
                  <span className="text-white">
                    <strong className="text-white">{title}</strong> {desc}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="animated-border bg-gradient-to-r from-eggplant-800/90 via-dark-800/95 to-eggplant-800/90 backdrop-blur-sm rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-3 text-white">
              How It Works
            </h2>
            <ol className="list-none pl-0 space-y-3 mb-6">
              {[
                "Import or generate customer lists (wishlist, master, unvisited)",
                "Set your goal: new prospects, key account coverage, or both",
                "Let the planner balance proximity, value, and visit frequency",
                "Preview your optimized route, regenerate or fine-tune as needed",
                "Track visits and performance — automatically",
              ].map((step, i) => (
                <li key={i} className="flex items-start">
                  <span className="inline-block min-w-[1.5rem] mr-2 text-neon-blue">
                    {i + 1}.
                  </span>
                  <span className="text-white">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="animated-border bg-gradient-to-r from-eggplant-800/90 via-dark-800/95 to-eggplant-800/90 backdrop-blur-sm rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-3 text-white">
              On the Roadmap
            </h2>
            <p className="text-white mb-3">
              This planner is evolving fast. Here’s what’s coming:
            </p>
            <ul className="list-none pl-0 space-y-3 mb-6">
              {upcomingFeatures.map(([title, desc], index) => (
                <li key={index} className="flex items-start">
                  <span className="inline-block w-2 h-2 mt-2 mr-2 rounded-full bg-neon-blue" />
                  <span className="text-white">
                    <strong className="text-white">{title}</strong> {desc}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="animated-border bg-gradient-to-r from-eggplant-800/90 via-dark-800/95 to-eggplant-800/90 backdrop-blur-sm rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-3 text-white">
              Let’s Talk
            </h2>
            <p className="text-white mb-4">
              Feedback or collaboration ideas? Drop a line:
            </p>
            <div className="space-y-3">
              <SparkleWrapper>
                <a
                  href="mailto:ritnourisrael@gmail.com"
                  className="flex items-center text-white hover:text-neon-blue transition-colors"
                >
                  <Mail className="h-5 w-5 mr-2" />
                  ritnourisrael@gmail.com
                </a>
              </SparkleWrapper>
              <SparkleWrapper>
                <a
                  href="https://github.com/israelcarnahan/ICjourney"
                  className="flex items-center text-white hover:text-neon-pink transition-colors"
                >
                  <Github className="h-5 w-5 mr-2" />
                  github.com/israelcarnahan/ICjourney
                </a>
              </SparkleWrapper>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
