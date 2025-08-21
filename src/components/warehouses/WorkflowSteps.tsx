import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle } from 'lucide-react';

interface WorkflowStep {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  active: boolean;
}

interface WorkflowStepsProps {
  steps: WorkflowStep[];
  currentStep: number;
}

export function WorkflowSteps({ steps, currentStep }: WorkflowStepsProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`
                flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors
                ${
                  step.completed
                    ? 'bg-green-500 border-green-500 text-white'
                    : step.active
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'bg-gray-100 border-gray-300 text-gray-500'
                }
              `}>
                {step.completed ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-medium">{step.id}</span>
                )}
              </div>
              <div className="mt-2 text-center">
                <div className={`text-sm font-medium ${
                  step.active ? 'text-blue-600' : step.completed ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {step.title}
                </div>
                <div className="text-xs text-gray-500 max-w-[120px] mt-1">
                  {step.description}
                </div>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className={`
                flex-1 h-0.5 mx-4 transition-colors
                ${
                  steps[index + 1].completed || steps[index + 1].active
                    ? 'bg-blue-300'
                    : 'bg-gray-200'
                }
              `} />
            )}
          </div>
        ))}
      </div>
      
      {/* Current Step Info */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center gap-2">
          <Badge variant="default" className="bg-blue-500">
            ขั้นตอนที่ {currentStep}
          </Badge>
          <span className="font-medium text-blue-900">
            {steps.find(s => s.id === currentStep)?.title}
          </span>
        </div>
        <p className="text-sm text-blue-700 mt-1">
          {steps.find(s => s.id === currentStep)?.description}
        </p>
      </div>
    </div>
  );
}