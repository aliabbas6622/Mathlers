'use client';

import { useState, useEffect } from 'react';
import { useUser, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { RecordCard } from '@/components/RecordCard';
import { questionService } from '@/services/api';
import { motion, AnimatePresence } from 'framer-motion';

interface Question {
  boxing_round: string;
  scenario: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  formatted_answer: string;
  step_by_step_solution: string;
  difficulty: string;
  record_card_id: number;
  math_topic: string;
}

export default function Home() {
  const { isSignedIn, user, isLoaded } = useUser();
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateQuestion = async () => {
    setLoading(true);
    setError(null);
    setSelectedOption(null);
    setShowSolution(false);
    
    try {
      const data = await questionService.generate('1', 'warm_up');
      setQuestion(data);
    } catch (err) {
      setError('Failed to generate question. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (option: string) => {
    if (selectedOption || !question) return;
    setSelectedOption(option);
    setShowSolution(true);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
              <span className="text-white font-black text-xl">M</span>
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight">MATHLERS</h1>
              <p className="text-xs text-slate-400 uppercase tracking-widest">The Arena</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="belt">BETA</Badge>
            {!isLoaded ? (
              <div className="w-8 h-8 rounded-full bg-slate-800 animate-pulse" />
            ) : isSignedIn ? (
              <UserButton 
                appearance={{
                  elements: {
                    avatarBox: "w-10 h-10",
                    userButtonPopoverCard: "shadow-xl",
                  }
                }}
              />
            ) : (
              <>
                <SignInButton mode="modal">
                  <Button size="sm" variant="outline">Sign In</Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button size="sm" variant="primary">Sign Up</Button>
                </SignUpButton>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero Section */}
        {!question && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <h2 className="text-5xl font-black text-white mb-4">
              Enter the <span className="text-arena-primary">Arena</span>
            </h2>
            <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
              Challenge yourself with boxing-themed mathematics problems. 
              Test your skills in the ultimate mental combat sport.
            </p>
            <Button 
              onClick={generateQuestion} 
              size="lg" 
              variant="primary"
              className="shadow-xl shadow-red-900/30"
            >
              Start Training
            </Button>
          </motion.div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-16">
            <div className="inline-block w-16 h-16 border-4 border-slate-700 border-t-arena-primary rounded-full animate-spin mb-4"></div>
            <p className="text-slate-400">Generating your challenge...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-6 text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <Button onClick={generateQuestion} variant="secondary">Try Again</Button>
          </div>
        )}

        {/* Question Display */}
        <AnimatePresence>
          {question && !loading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-8"
            >
              {/* Round Info */}
              <div className="flex items-center justify-between">
                <Badge variant="belt">{question.boxing_round}</Badge>
                <Badge variant="default">{question.math_topic.replace('_', ' ').toUpperCase()}</Badge>
              </div>

              {/* Question Card */}
              <div className="arena-card bg-slate-900/80">
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-white mb-6">
                    {question.question_text}
                  </h3>

                  {/* Options */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {question.options.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => handleOptionSelect(option)}
                        disabled={selectedOption !== null}
                        className={`p-4 rounded-lg border-2 font-bold text-lg transition-all ${
                          selectedOption === option
                            ? option === question.correct_answer
                              ? 'border-green-500 bg-green-900/20 text-green-400'
                              : 'border-red-500 bg-red-900/20 text-red-400'
                            : 'border-slate-700 bg-slate-800 hover:border-slate-500 text-slate-200'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>

                  {/* Solution */}
                  {showSolution && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="border-t border-slate-800 pt-6"
                    >
                      <div className={`mb-4 p-4 rounded-lg ${
                        selectedOption === question.correct_answer
                          ? 'bg-green-900/20 border border-green-800'
                          : 'bg-red-900/20 border border-red-800'
                      }`}>
                        <p className={`font-bold ${
                          selectedOption === question.correct_answer
                            ? 'text-green-400'
                            : 'text-red-400'
                        }`}>
                          {selectedOption === question.correct_answer
                            ? '✓ Correct!'
                            : '✗ Incorrect'}
                        </p>
                        <p className="text-slate-300 mt-2">
                          Answer: <span className="font-black text-white">{question.formatted_answer}</span>
                        </p>
                      </div>

                      <div className="bg-slate-950 rounded-lg p-6 border border-slate-800">
                        <h4 className="text-lg font-bold text-white mb-3">Step-by-Step Solution</h4>
                        <p className="text-slate-300 whitespace-pre-wrap">
                          {question.step_by_step_solution}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-center gap-4">
                <Button 
                  onClick={generateQuestion} 
                  variant="secondary"
                  size="lg"
                >
                  Next Challenge
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
