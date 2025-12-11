import React from 'react';
import { AgentType } from '../types';
import { Bot, FileText, Calendar, User, CreditCard, Search } from 'lucide-react';

interface Props {
  type: AgentType;
}

const AgentBadge: React.FC<Props> = ({ type }) => {
  const config = {
    [AgentType.COORDINATOR]: { color: 'bg-purple-100 text-purple-800', icon: Bot },
    [AgentType.PATIENT_INFO]: { color: 'bg-blue-100 text-blue-800', icon: User },
    [AgentType.SCHEDULER]: { color: 'bg-green-100 text-green-800', icon: Calendar },
    [AgentType.MEDICAL_RECORDS]: { color: 'bg-red-100 text-red-800', icon: FileText },
    [AgentType.BILLING]: { color: 'bg-yellow-100 text-yellow-800', icon: CreditCard },
    [AgentType.GOOGLE_SEARCH]: { color: 'bg-orange-100 text-orange-800', icon: Search },
  };

  const { color, icon: Icon } = config[type] || config[AgentType.COORDINATOR];

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${color} border border-opacity-20 border-current`}>
      <Icon className="w-3 h-3" />
      {type}
    </div>
  );
};

export default AgentBadge;