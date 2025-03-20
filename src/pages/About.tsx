import React from 'react';
import { Beer, Github, Mail, Calendar } from 'lucide-react';
import SparkleWrapper from '../components/Sparkles';

const About: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="animated-border bg-gradient-to-r from-eggplant-900/90 via-dark-900/95 to-eggplant-900/90 backdrop-blur-sm rounded-lg p-8 mb-8">
        <div className="flex items-center mb-6">
          <Beer className="h-8 w-8 text-neon-blue animate-pulse mr-3" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-neon-purple via-neon-pink to-neon-blue bg-clip-text text-transparent animate-gradient-x">
            About Israel's Journey Planner
          </h1>
        </div>

        <div className="prose max-w-none">
          <p className="text-lg mb-4 text-eggplant-100">
            Journey Planner is your intelligent field sales companion, born from real-world experience in territory management. Originally developed for beverage industry professionals, it's now helping field sales representatives across industries optimize their customer visits, maximize their impact, and exceed their targets - all while maintaining that crucial work-life balance.
          </p>

          <div className="animated-border bg-gradient-to-r from-eggplant-800/90 via-dark-800/95 to-eggplant-800/90 backdrop-blur-sm rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-3 text-eggplant-100">Key Features</h2>
            <ul className="list-none pl-0 space-y-3 mb-6">
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 mt-2 mr-2 rounded-full bg-neon-blue"></span>
                <span className="text-eggplant-100"><strong className="text-eggplant-100">Smart Daily Planning:</strong> Optimize up to 8 strategic customer visits per day, perfectly balanced between high-priority prospects and key account maintenance.</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 mt-2 mr-2 rounded-full bg-neon-blue"></span>
                <span className="text-eggplant-100"><strong className="text-eggplant-100">Intelligent Prioritization:</strong> Multiple customer lists (wishlist, unvisited, master file) with smart prioritization that matches your business goals.</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 mt-2 mr-2 rounded-full bg-neon-blue"></span>
                <span className="text-eggplant-100"><strong className="text-eggplant-100">Location-Smart Routing:</strong> Group visits by proximity to maximize face time and minimize windshield time.</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 mt-2 mr-2 rounded-full bg-neon-blue"></span>
                <span className="text-eggplant-100"><strong className="text-eggplant-100">Visit History Tracking:</strong> Never drop the ball on important accounts with smart visit frequency management.</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 mt-2 mr-2 rounded-full bg-neon-blue"></span>
                <span className="text-eggplant-100"><strong className="text-eggplant-100">Excel Integration:</strong> One-click export to Excel for easy reporting and team sharing.</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 mt-2 mr-2 rounded-full bg-neon-blue"></span>
                <span className="text-eggplant-100"><strong className="text-eggplant-100">KPI Achievement:</strong> Built-in deadline management ensures you're always hitting your numbers.</span>
              </li>
            </ul>
          </div>

          <div className="animated-border bg-gradient-to-r from-eggplant-800/90 via-dark-800/95 to-eggplant-800/90 backdrop-blur-sm rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-3 text-eggplant-100">How It Works</h2>
            <p className="text-eggplant-100 mb-3">Journey Planner uses cutting-edge algorithms to:</p>
            <ol className="list-none pl-0 space-y-3 mb-6">
              {[
                "Process your account lists and prioritize based on your strategic goals",
                "Group accounts by location to minimize travel time",
                "Balance visit frequency with account priority",
                "Ensure high-value opportunities get the attention they deserve",
                "Calculate optimal routes between locations",
                "Generate a schedule that maximizes your impact while minimizing stress"
              ].map((item, index) => (
                <li key={index} className="flex items-start">
                  <span className="inline-block min-w-[1.5rem] mr-2 text-neon-blue">{index + 1}.</span>
                  <span className="text-eggplant-100">{item}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="animated-border bg-gradient-to-r from-eggplant-800/90 via-dark-800/95 to-eggplant-800/90 backdrop-blur-sm rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-3 text-eggplant-100">Future Development</h2>
            <p className="text-eggplant-100 mb-3">We're constantly innovating to make your field sales life easier. Coming soon:</p>
            <ul className="list-none pl-0 space-y-3 mb-6">
              {[
                ["Calendar Integration", "Sync your schedule directly with Outlook and other calendar apps"],
                ["Google Maps Integration", "for real-time route optimization"],
                ["Smart Visit Frequency", "based on account value and potential"],
                ["Business Hours Integration", "to ensure every visit counts"],
                ["Account Matching Intelligence", "to prevent duplicate entries"],
                ["Advanced Priority Algorithms", "based on sales potential"],
                ["Smart Note Analysis", "Automatically flag follow-up opportunities"]
              ].map(([title, desc], index) => (
                <li key={index} className="flex items-start">
                  <span className="inline-block w-2 h-2 mt-2 mr-2 rounded-full bg-neon-blue"></span>
                  <span className="text-eggplant-100">
                    <strong className="text-eggplant-100">{title}</strong> {desc}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="animated-border bg-gradient-to-r from-eggplant-800/90 via-dark-800/95 to-eggplant-800/90 backdrop-blur-sm rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-3 text-eggplant-100">Contact</h2>
            <p className="text-eggplant-100 mb-4">Questions, feedback, or feature requests? Let's talk:</p>
            <div className="space-y-3">
              <SparkleWrapper>
                <a 
                  href="mailto:ritnourisrael@gmail.com" 
                  className="flex items-center text-eggplant-100 hover:text-neon-blue transition-colors"
                >
                  <Mail className="h-5 w-5 mr-2" />
                  ritnourisrael@gmail.com
                </a>
              </SparkleWrapper>
              <SparkleWrapper>
                <a 
                  href="https://github.com/israelcarnahan/visit_planner" 
                  className="flex items-center text-eggplant-100 hover:text-neon-pink transition-colors"
                >
                  <Github className="h-5 w-5 mr-2" />
                  github.com/israelcarnahan/visit_planner
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