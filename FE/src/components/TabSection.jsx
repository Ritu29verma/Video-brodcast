import React, { useState } from 'react';

const TabSection = () => {
  const [activeTab, setActiveTab] = useState('All Bets');

  const tabData = {
    'All Bets': [
      { user: 'a***1', bet: '150.00', multiplier: '1.78x', cashout: '267.00' },
      { user: 'b***2', bet: '75.00', multiplier: '2.50x', cashout: '187.50' },
      { user: 'c***3', bet: '200.00', multiplier: '3.12x', cashout: '624.00' },
      { user: 'd***4', bet: '50.00', multiplier: '1.20x', cashout: '60.00' },
      { user: 'e***5', bet: '300.00', multiplier: '4.50x', cashout: '1350.00' },
      { user: 'f***6', bet: '25.00', multiplier: '2.00x', cashout: '50.00' },
      { user: 'g***7', bet: '500.00', multiplier: '1.50x', cashout: '750.00' },
      { user: 'h***8', bet: '100.00', multiplier: '5.00x', cashout: '500.00' },
      { user: 'i***9', bet: '80.00', multiplier: '3.75x', cashout: '300.00' },
      { user: 'j***0', bet: '40.00', multiplier: '2.25x', cashout: '90.00' },
    ],
    'My Bets': [
      { date: '30 Jan', time: '11:30', bet: '2.00', multiplier: '1.50x', cashout: '3.00' },
      { date: '30 Jan', time: '11:29', bet: '3.50', multiplier: '2.00x', cashout: '7.00' },
      { date: '30 Jan', time: '11:28', bet: '1.25', multiplier: '3.00x', cashout: '3.75' },
      { date: '30 Jan', time: '11:27', bet: '2.00', multiplier: '2.50x', cashout: '5.00' },
      { date: '30 Jan', time: '11:26', bet: '5.00', multiplier: '1.80x', cashout: '9.00' },
      { date: '30 Jan', time: '11:25', bet: '3.00', multiplier: '1.50x', cashout: '4.50' },
      { date: '30 Jan', time: '11:24', bet: '1.75', multiplier: '2.25x', cashout: '3.94' },
      { date: '30 Jan', time: '11:23', bet: '2.50', multiplier: '3.20x', cashout: '8.00' },
      { date: '30 Jan', time: '11:22', bet: '1.10', multiplier: '2.10x', cashout: '2.31' },
      { date: '30 Jan', time: '11:21', bet: '4.00', multiplier: '2.75x', cashout: '11.00' },
    ],
    Top: [
      { user: 'z***1', bet: '20.00', multiplier: '5000.00x', cashout: '20.00', win: '100,000.00' },
      { user: 'y***2', bet: '15.00', multiplier: '4500.00x', cashout: '15.00', win: '67,500.00' },
      { user: 'x***3', bet: '10.00', multiplier: '3500.00x', cashout: '10.00', win: '35,000.00' },
      { user: 'w***4', bet: '25.00', multiplier: '2500.00x', cashout: '25.00', win: '62,500.00' },
      { user: 'v***5', bet: '30.00', multiplier: '2000.00x', cashout: '30.00', win: '60,000.00' },
      // { user: 'u***6', bet: '50.00', multiplier: '1500.00x', cashout: '50.00', win: '75,000.00' },
      // { user: 't***7', bet: '35.00', multiplier: '1000.00x', cashout: '35.00', win: '35,000.00' },
      // { user: 's***8', bet: '40.00', multiplier: '800.00x', cashout: '40.00', win: '32,000.00' },
      // { user: 'r***9', bet: '45.00', multiplier: '750.00x', cashout: '45.00', win: '33,750.00' },
      // { user: 'q***0', bet: '60.00', multiplier: '500.00x', cashout: '60.00', win: '30,000.00' },
    ],
  };
  

  return (
    <div className="w-full lg:w-1/3 bg-gray-800 rounded-md shadow-lg p-4 h-auto lg:h-screen">
      {/* Tabs */}
      <div className="flex justify-between border-b pb-2 border-gray-700">
        {['All Bets', 'My Bets', 'Top'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`font-semibold px-2 py-1 ${
              activeTab === tab ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-3 h-full overflow-y-auto">
        {activeTab === 'All Bets' &&
          tabData['All Bets'].map((entry, index) => (
            <div
              key={index}
              className={`flex justify-between items-center p-2 rounded-md ${
                index % 2 === 0 ? 'bg-gray-700' : ''
              }`}
            >
              <span className="text-white">{entry.user}</span>
              <span className="text-white">{entry.bet} Rs.</span>
              <span className="text-blue-400">{entry.multiplier}</span>
              <span className="text-white">{entry.cashout} Rs.</span>
            </div>
          ))}

        {activeTab === 'My Bets' &&
          tabData['My Bets'].map((entry, index) => (
            <div
              key={index}
              className={`flex justify-between items-center p-2 rounded-md ${
                index % 2 === 0 ? 'bg-gray-700' : ''
              }`}
            >
              <span className="text-white">{entry.date} {entry.time}</span>
              <span className="text-white">{entry.bet} USD</span>
              <span className="text-blue-400">{entry.multiplier}</span>
              <span className="text-white">{entry.cashout} USD</span>
            </div>
          ))}

        {activeTab === 'Top' &&
          tabData['Top'].map((entry, index) => (
            <div
              key={index}
              className={`flex flex-col md:flex-row justify-between items-center p-2 rounded-md ${
                index % 2 === 0 ? 'bg-gray-700' : ''
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className="text-white">{entry.user}</span>
              </div>
              <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
                <span className="text-white">Bet: {entry.bet} USD</span>
                <span className="text-blue-400">Multiplier: {entry.multiplier}</span>
                <span className="text-white">Cashout: {entry.cashout} USD</span>
                <span className="text-green-400">Win: {entry.win} USD</span>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default TabSection;
