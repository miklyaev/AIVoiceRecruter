import React from 'react';
import type { Report } from '../types';

interface FinalReportProps {
  report: Report;
}

export const FinalReport: React.FC<FinalReportProps> = ({ report }) => {
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRecommendationBadge = () => {
    switch (report.hiringRecommendation) {
      case 'рекомендуется к найму':
        return { text: '✅ Рекомендуется к найму', color: 'bg-green-100 text-green-800 border-green-300' };
      case 'можно рассмотреть':
        return { text: '🤔 Можно рассмотреть', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' };
      case 'пока не рекомендуется':
        return { text: '❌ Пока не рекомендуется', color: 'bg-red-100 text-red-800 border-red-300' };
    }
  };

  const badge = getRecommendationBadge();

  return (
    <div className="bg-white border-2 border-purple-200 rounded-xl p-6 shadow-lg chat-message-enter">
      <h2 className="text-xl font-bold text-center mb-4">📋 Итог собеседования</h2>

      <div className="text-center mb-6">
        <span className="text-sm text-gray-500">Общая оценка</span>
        <div className={`text-4xl font-bold ${getScoreColor(report.overallScore)}`}>
          {report.overallScore}/10
        </div>
      </div>

      <div className="space-y-4">
        {report.strengths.length > 0 && (
          <div>
            <h3 className="font-semibold text-green-700 mb-1">✅ Сильные стороны</h3>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-0.5">
              {report.strengths.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        )}

        {report.weaknesses.length > 0 && (
          <div>
            <h3 className="font-semibold text-red-700 mb-1">⚠️ Слабые стороны</h3>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-0.5">
              {report.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </div>
        )}

        {report.developmentRecommendations.length > 0 && (
          <div>
            <h3 className="font-semibold text-blue-700 mb-1">📈 Рекомендации по развитию</h3>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-0.5">
              {report.developmentRecommendations.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>
        )}

        <div className={`border rounded-lg px-4 py-3 text-center font-medium ${badge.color}`}>
          {badge.text}
        </div>

        {report.recommendationReason && (
          <p className="text-sm text-gray-600 italic bg-gray-50 rounded-lg p-3">
            {report.recommendationReason}
          </p>
        )}

        {report.insufficientData && (
          <p className="text-sm text-yellow-600 bg-yellow-50 rounded-lg p-3">
            ⚠️ Отмечена недостаточность данных для полной оценки.
          </p>
        )}
      </div>

      <p className="text-xs text-gray-400 text-center mt-4 border-t pt-3">
        Отчёт сформирован AI и предназначен для поддержки решения. Финальное решение должен принимать человек.
      </p>
    </div>
  );
};