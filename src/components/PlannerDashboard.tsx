import React, { useState } from 'react';
import FileUploader from '../components/FileUploader';
import ScheduleSettings from '../components/ScheduleSettings';
import ScheduleDisplay from '../components/ScheduleDisplay';
import UnscheduledPubsPanel from '../components/UnscheduledPubsPanel';
import RepStatsPanel from '../components/RepStatsPanel';
import { usePubData } from '../context/PubDataContext';
import { planVisits } from '../utils/scheduleUtils';
import { checkPubOpeningHours } from '../utils/openingHours';
import { Pub } from '../context/PubDataContext';

const PlannerDashboard: React.FC = () => {
  const { 
    wishlistPubs, setWishlistPubs,
    unvisitedPubs, setUnvisitedPubs,
    masterfilePubs, setMasterfilePubs,
    repslyWins, setRepslyWins,
    businessDays, setSchedule,
    repslyDeadline,
    homeAddress,
    visitsPerDay
  } = usePubData() || {
    wishlistPubs: [],
    unvisitedPubs: [],
    masterfilePubs: [],
    repslyWins: [],
    businessDays: 0,
    setSchedule: () => {},
    repslyDeadline: '',
    homeAddress: '',
    visitsPerDay: 5,
    setWishlistPubs: () => {},
    setUnvisitedPubs: () => {},
    setMasterfilePubs: () => {},
    setRepslyWins: () => {}
  };

  const [error, setError] = useState<string | null>(null);
  const [unscheduledPubs, setUnscheduledPubs] = useState<Pub[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Clear schedule before generating new one
  const clearSchedule = () => {
    console.log('Clearing previous schedule');
    setSchedule([]);
    setUnscheduledPubs([]);
  };

  const filterLateOpeningPubs = (pubs: Pub[]): [Pub[], Pub[]] => {
    const schedulable: Pub[] = [];
    const unschedulable: Pub[] = [];

    pubs.forEach(pub => {
      const hours = checkPubOpeningHours(pub.pub, new Date().toISOString());
      if (hours.isOpen) {
        schedulable.push(pub);
      } else {
        unschedulable.push(pub);
      }
    });

    return [schedulable, unschedulable];
  };

  const generateSchedule = () => {
    console.log('Generate schedule triggered');
    setIsGenerating(true);
    setError(null);

    if (repslyWins.length > 0 && !repslyDeadline) {
      setError("Please set a follow-up deadline for Repsly wins");
      setIsGenerating(false);
      return;
    }

    if (!homeAddress) {
      setError("Please enter your home address postcode");
      setIsGenerating(false);
      return;
    }

    // Clear previous schedule
    clearSchedule();

    const processedRepslyWins = repslyWins.map(pub => ({
      ...pub,
      Priority: 'RepslyWin',
      followUpDate: repslyDeadline
    }));

    const allPubs = [
      ...processedRepslyWins,
      ...wishlistPubs.map(pub => ({ ...pub, Priority: 'Wishlist' })),
      ...unvisitedPubs.map(pub => ({ ...pub, Priority: 'Unvisited' })),
      ...masterfilePubs.map(pub => ({ ...pub, Priority: 'Masterfile' }))
    ];

    const [schedulablePubs, unschedulablePubs] = filterLateOpeningPubs(allPubs);
    setUnscheduledPubs(unschedulablePubs);

    if (schedulablePubs.length === 0) {
      setError("No pubs available to schedule");
      setIsGenerating(false);
      return;
    }

    console.log('Generating new schedule with:', {
      pubs: schedulablePubs.length,
      days: businessDays,
      home: homeAddress,
      visitsPerDay
    });

    const newSchedule = planVisits(
      schedulablePubs, 
      new Date(), 
      businessDays, 
      homeAddress,
      visitsPerDay
    );
    
    console.log('Generated schedule:', newSchedule);
    setSchedule(newSchedule);
    setIsGenerating(false);
  };

  const handleScheduleAnyway = (pub: Pub) => {
    setUnscheduledPubs(prev => prev.filter(p => p.pub !== pub.pub));
    const newSchedule = planVisits(
      [pub],
      new Date(),
      1,
      homeAddress,
      1
    );
    
    setSchedule(prev => [...prev, ...newSchedule]);
  };

  return (
    <div className="max-w-7xl mx-auto px-4">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-neon-purple via-neon-pink to-neon-blue bg-clip-text text-transparent animate-gradient-x">
        Prioritize Your House Lists
      </h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        <div className="lg:col-span-9">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className={`lg:col-span-2 ${!isQuickStartExpanded && 'lg:col-span-3'}`}>
              <div className="animated-border bg-gradient-to-r from-eggplant-900/90 via-dark-900/95 to-eggplant-900/90 backdrop-blur-sm rounded-lg shadow-xl p-6 sm:p-8 mb-4 sm:mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold mb-2 bg-gradient-to-r from-neon-purple via-neon-pink to-neon-blue bg-clip-text text-transparent">
                  Let's Get Started! 🚀
                </h2>
                <p className="text-lg text-eggplant-200 mb-6">
                  First, we need your complete pub list to work our magic ✨
                </p>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-eggplant-100">Step 1: Upload Your Master List</h3>
                    <FileUploader 
                      onFileLoaded={setMasterfilePubs} 
                      fileType="masterfile"
                      isLoaded={masterfilePubs.length > 0}
                      description="This is your complete territory list - every pub you're responsible for. We'll use this as our foundation to build your perfect schedule."
                      isRequired={true}
                    />
                    {masterfilePubs.length > 0 && (
                      <p className="mt-4 text-sm text-green-200">
                        🎯 Excellent! {masterfilePubs.length} pubs loaded and ready for optimization
                      </p>
                    )}
                  </div>

                  {masterfilePubs.length > 0 && (
                    <div className="pt-6 border-t border-eggplant-800/30">
                      <h3 className="text-xl font-semibold mb-3 text-eggplant-100">
                        Step 2: Enhance Your Schedule (Optional)
                      </h3>
                      <p className="text-eggplant-200 mb-4">
                        Want to supercharge your planning? Add these optional lists to make your schedule even smarter! 🚀
                      </p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium mb-2 text-eggplant-100 flex items-center gap-2">
                            <span className="inline-block w-6 h-6 rounded-full bg-purple-900/50 text-purple-200 border border-purple-700/50 text-xs flex items-center justify-center">1</span>
                            Recent Wins
                          </h4>
                          <FileUploader 
                            onFileLoaded={setRepslyWins} 
                            fileType="repsly"
                            isLoaded={repslyWins.length > 0}
                            description="Track and follow up on your recent installations to ensure success!"
                          />
                        </div>

                        <div>
                          <h4 className="font-medium mb-2 text-eggplant-100 flex items-center gap-2">
                            <span className="inline-block w-6 h-6 rounded-full bg-blue-900/50 text-blue-200 border border-blue-700/50 text-xs flex items-center justify-center">2</span>
                            Priority Targets
                          </h4>
                          <FileUploader 
                            onFileLoaded={setWishlistPubs} 
                            fileType="wishlist"
                            isLoaded={wishlistPubs.length > 0}
                            description="Your high-priority accounts that need special attention"
                          />
                        </div>

                        <div>
                          <h4 className="font-medium mb-2 text-eggplant-100 flex items-center gap-2">
                            <span className="inline-block w-6 h-6 rounded-full bg-green-900/50 text-green-200 border border-green-700/50 text-xs flex items-center justify-center">4</span>
                            Unvisited Pubs
                          </h4>
                          <FileUploader 
                            onFileLoaded={setUnvisitedPubs} 
                            fileType="unvisited"
                            isLoaded={unvisitedPubs.length > 0}
                            description="Accounts you haven't visited recently that need attention"
                          />
                        </div>
                      </div>
                      
                      <div className="mt-6 p-4 rounded-lg bg-eggplant-800/30 border border-eggplant-700/30">
                        <p className="text-sm text-eggplant-200">
                          <span className="text-neon-purple">Pro Tip:</span> The more lists you add, the smarter your schedule becomes! 
                          We'll automatically prioritize and optimize your visits based on all the information you provide.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className={`transition-all duration-300 ${!isQuickStartExpanded && 'hidden'}`}>
              <ScheduleSettings 
                onGenerateSchedule={generateSchedule}
                isGenerating={isGenerating}
              />
            </div>
          </div>
          
          {masterfilePubs.length > 0 && <ScheduleDisplay />}
        </div>

        <div className="lg:col-span-3 space-y-6">
          <RepStatsPanel />
          {unscheduledPubs.length > 0 && (
            <UnscheduledPubsPanel 
              pubs={unscheduledPubs}
              onScheduleAnyway={handleScheduleAnyway}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default PlannerDashboard;