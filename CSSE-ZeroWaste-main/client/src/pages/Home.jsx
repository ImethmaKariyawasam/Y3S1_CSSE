import React from 'react';
import { useState, useEffect } from 'react';
import Lottie from 'react-lottie-player';
import { Button } from 'flowbite-react';

// You'll need to replace these with actual Lottie animation JSON files
import recyclingAnimation from '../assets/recycle.json';

export default function Home() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-100 to-green-200">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center text-green-800 mb-6">
          Welcome to Zero Waste
        </h1>
        <p className="text-xl text-center text-green-700 mb-8">
          Smart Waste Management for a Cleaner Future
        </p>
        
        <div className="flex flex-col md:flex-row justify-around items-center mb-12">
          {isClient && (
            <>
              <div className="w-full md:w-1/2">
                <Lottie
                  loop
                  animationData={recyclingAnimation}
                  play
                  style={{ width: 300, height: 300, margin: 'auto' }}
                />
              </div>
            </>
          )}
        </div>
        
        <div className="text-center mb-12">
          <h2 className="text-2xl font-semibold text-green-800 mb-4">
            Revolutionizing Waste Management
          </h2>
          <p className="text-lg text-green-700 mb-6">
            Zero Waste uses smart technology to optimize waste collection,
            promote recycling, and reduce environmental impact.
          </p>
          <Button className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded">
            Learn More
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard 
            title="Smart Collection"
            description="IoT-enabled bins for efficient waste collection"
          />
          <FeatureCard 
            title="Recycling Insights"
            description="Data-driven recycling recommendations"
          />
          <FeatureCard 
            title="Community Engagement"
            description="Gamification to encourage responsible waste management"
          />
        </div>
      </main>
    </div>
  );
}

function FeatureCard({ title, description }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold text-green-800 mb-2">{title}</h3>
      <p className="text-green-700">{description}</p>
    </div>
  );
}