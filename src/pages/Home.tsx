import React, { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Beer, Calendar, MapPin, Clock, TrendingUp, ChevronLeft, ChevronRight, Target, Users, BarChart, Zap } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import SparkleWrapper from '../components/Sparkles';

const features = [
  {
    icon: Calendar,
    title: "Smart Journey Planning",
    description: "Transform your territory management with AI-powered visit planning. Our algorithm balances customer priorities, visit history, and location data to create efficient routes that maximize face time with your most valuable accounts.",
    value: "Cut planning time by 75% and spend more time building relationships that drive results. No more Sunday night route planning headaches!",
    impact: "Proven to increase customer face time by 30% while reducing windshield time. Your customers will notice the difference in engagement quality."
  },
  {
    icon: Target,
    title: "Intelligent Route Optimization",
    description: "Stay ahead of your targets with smart deadline management. Set visit frequency goals for key accounts and let the system ensure you're hitting your numbers without the stress of last-minute rushes.",
    value: "Never miss a critical account visit or quarterly target again. The system prioritizes your must-see accounts while maintaining balanced coverage.",
    impact: "Consistently exceed KPIs and demonstrate strategic territory management to leadership. Show them you're not just working hard - you're working smart."
  },
  {
    icon: MapPin,
    title: "Strategic Territory Coverage",
    description: "Say goodbye to zigzagging across your territory! Our smart clustering system groups nearby accounts together, creating logical daily routes that maximize your selling time.",
    value: "Save on fuel, reduce stress, and hit more accounts per day with optimized travel paths. Your car (and your stress levels) will thank you!",
    impact: "Significant reduction in travel expenses and increased daily productivity. More quality conversations, less time behind the wheel."
  },
  {
    icon: Users,
    title: "Dynamic Account Prioritization",
    description: "Not all accounts are created equal - and now your schedule reflects that reality. Easily categorize accounts by potential, current value, and strategic importance to ensure your time is invested where it matters most.",
    value: "Balance high-potential prospects with key account maintenance. Never let a hot lead go cold while maintaining relationships with your bread-and-butter accounts.",
    impact: "Better resource allocation leads to higher conversion rates and stronger customer relationships across your entire portfolio."
  },
  {
    icon: BarChart,
    title: "Automated Journey Optimization",
    description: "Turn your field activity into actionable insights. Track visit patterns, territory coverage, and time management metrics to continuously refine your approach.",
    value: "Make data-driven decisions about territory management and prove your strategic approach to leadership. Numbers don't lie - and yours will look great!",
    impact: "Demonstrate your strategic thinking and territory mastery to management. Show them you're not just a sales rep - you're a business manager."
  },
  {
    icon: Zap,
    title: "Efficient Route Planning",
    description: "Life in sales is unpredictable - your planning tool shouldn't be rigid. Instantly adapt your schedule when opportunities or emergencies arise, without losing your strategic framework.",
    value: "Stay agile and responsive to market opportunities while maintaining your long-term strategy. The best of both worlds!",
    impact: "Increased ability to capitalize on sales opportunities while maintaining systematic territory coverage. Win those big accounts without dropping the ball on regular business."
  }
];

const Home: React.FC = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true,
    slidesToScroll: window.innerWidth < 768 ? 1 : 2,
    containScroll: 'trimSnaps'
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    onSelect();
    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on('select', onSelect);

    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="animated-border bg-gradient-to-r from-eggplant-900/90 via-dark-900/95 to-eggplant-900/90 backdrop-blur-sm rounded-xl p-4 sm:p-8 mb-8 sm:mb-12">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-2xl sm:text-4xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-neon-purple via-neon-pink to-neon-blue bg-clip-text text-transparent animate-gradient-x">
            Optimize Your Journey
          </h1>
          <p className="text-lg sm:text-xl mb-6 sm:mb-8 text-eggplant-100">
            Plan efficient routes, prioritize key accounts, and meet your KPIs with our specialized tool for Budweiser Brewing Group sales representatives.
          </p>
          <SparkleWrapper>
            <Link
              to="/planner"
              className="inline-block bg-gradient-to-r from-neon-purple via-neon-pink to-neon-blue text-white font-bold py-2 sm:py-3 px-6 sm:px-8 rounded-lg hover:shadow-neon-purple transition-all duration-300 transform hover:scale-105"
            >
              Start Planning
            </Link>
          </SparkleWrapper>
        </div>
      </div>

      <div className="mb-8 sm:mb-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8 bg-gradient-to-r from-neon-purple via-neon-pink to-neon-blue bg-clip-text text-transparent animate-gradient-x">
          Revolutionize Your Territory Management
        </h2>
        
        <div className="relative px-12">
          <button
            className="absolute -left-4 top-1/2 -translate-y-1/2 bg-gradient-to-r from-neon-purple to-neon-blue p-2 rounded-full shadow-lg hover:shadow-neon-purple transition-all duration-300 z-10 hidden sm:block"
            onClick={scrollPrev}
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
          
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex">
              {features.map((feature, index) => (
                <div key={index} className="flex-[0_0_100%] sm:flex-[0_0_50%] min-w-0 px-4">
                  <div className="animated-border bg-gradient-to-r from-eggplant-900/90 via-dark-900/95 to-eggplant-900/90 backdrop-blur-sm rounded-lg p-4 sm:p-6 h-full">
                    <div className="flex items-center mb-4">
                      <div className="flex items-center justify-center h-12 w-12 rounded-md bg-gradient-to-r from-neon-purple to-neon-blue text-white mr-4">
                        <feature.icon className="h-6 w-6" />
                      </div>
                      <h3 className="text-xl font-bold text-eggplant-100">{feature.title}</h3>
                    </div>
                    <p className="text-eggplant-200 mb-4 text-sm">{feature.description}</p>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-eggplant-100 mb-2 text-sm">Value to You:</h4>
                        <p className="text-eggplant-200 text-sm">{feature.value}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-eggplant-100 mb-2 text-sm">Business Impact:</h4>
                        <p className="text-eggplant-200 text-sm">{feature.impact}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <button
            className="absolute -right-4 top-1/2 -translate-y-1/2 bg-gradient-to-r from-neon-purple to-neon-blue p-2 rounded-full shadow-lg hover:shadow-neon-purple transition-all duration-300 z-10 hidden sm:block"
            onClick={scrollNext}
          >
            <ChevronRight className="h-6 w-6 text-white" />
          </button>
        </div>

        <div className="flex justify-center mt-4 sm:mt-6">
          {scrollSnaps.map((_, index) => (
            <button
              key={index}
              className={`h-2 w-4 sm:w-8 mx-1 rounded-full transition-all duration-300 ${
                index === selectedIndex 
                  ? 'bg-gradient-to-r from-neon-purple to-neon-blue shadow-neon-purple' 
                  : 'bg-gradient-to-r from-eggplant-600 to-eggplant-700'
              }`}
              onClick={() => emblaApi?.scrollTo(index)}
            />
          ))}
        </div>
      </div>

      <div className="animated-border bg-gradient-to-r from-eggplant-900/90 via-dark-900/95 to-eggplant-900/90 backdrop-blur-sm rounded-lg p-4 sm:p-8 mb-8 sm:mb-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8 bg-gradient-to-r from-neon-purple via-neon-pink to-neon-blue bg-clip-text text-transparent animate-gradient-x">
          How It Works
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-r from-neon-purple to-neon-blue text-white mb-4">
              <span className="text-xl font-bold">1</span>
            </div>
            <h3 className="text-lg font-medium mb-2 text-eggplant-100">Upload Your Pub Lists</h3>
            <p className="text-eggplant-200">
              Import your wishlist, unvisited pubs, and master file Excel sheets.
            </p>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-r from-neon-purple to-neon-blue text-white mb-4">
              <span className="text-xl font-bold">2</span>
            </div>
            <h3 className="text-lg font-medium mb-2 text-eggplant-100">Configure Settings</h3>
            <p className="text-eggplant-200">
              Set your scheduling preferences, business days, and KPI deadlines.
            </p>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-r from-neon-purple to-neon-blue text-white mb-4">
              <span className="text-xl font-bold">3</span>
            </div>
            <h3 className="text-lg font-medium mb-2 text-eggplant-100">Get Your Schedule</h3>
            <p className="text-eggplant-200">
              View and export your optimized visit schedule with route information.
            </p>
          </div>
        </div>
      </div>

      <div className="animated-border bg-gradient-to-r from-eggplant-900/90 via-dark-900/95 to-eggplant-900/90 backdrop-blur-sm rounded-xl p-4 sm:p-8 mb-8 sm:mb-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3 sm:mb-4 bg-gradient-to-r from-neon-purple via-neon-pink to-neon-blue bg-clip-text text-transparent animate-gradient-x">
          Transform Your Territory Management Today
        </h2>
        <p className="text-lg sm:text-xl text-center text-eggplant-100 mb-6">
          Take control of your schedule and maximize your impact in the field
        </p>
        <div className="text-center">
          <SparkleWrapper>
            <Link
              to="/planner"
              className="inline-flex items-center bg-gradient-to-r from-neon-purple via-neon-pink to-neon-blue text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-lg hover:shadow-neon-purple transition-all duration-300 transform hover:scale-105"
            >
              <Beer className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
              Start Optimizing
            </Link>
          </SparkleWrapper>
        </div>
      </div>
    </div>
  );
};

export default Home;