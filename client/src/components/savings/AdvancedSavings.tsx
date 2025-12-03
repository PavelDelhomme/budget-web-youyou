import { useState, useEffect } from 'react';
import { SavingsGoal, SavingsProject } from '../../core/types';
import { currency } from '../../lib/utils';
import { MLApi } from '../../lib/utils/mlApi';

interface AdvancedSavingsProps {
  goals: SavingsGoal[];
  projects: SavingsProject[];
  onUpdateGoals: (goals: SavingsGoal[]) => void;
  onUpdateProjects: (projects: SavingsProject[]) => void;
}

export function AdvancedSavings({
  goals,
  projects,
  onUpdateGoals,
  onUpdateProjects,
}: AdvancedSavingsProps) {
  const [activeTab, setActiveTab] = useState<'goals' | 'projects'>('goals');
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [isAddingProject, setIsAddingProject] = useState(false);

  const [newGoal, setNewGoal] = useState({
    name: '',
    type: 'minimum' as 'minimum' | 'precaution' | 'project',
    targetAmount: 0,
    currentAmount: 0,
    priority: 1,
  });

  const [newProject, setNewProject] = useState({
    name: '',
    targetAmount: 0,
    currentAmount: 0,
    targetDate: '',
    monthlyContribution: 0,
  });

  function addGoal() {
    if (!newGoal.name || newGoal.targetAmount === 0) return;
    const goal: SavingsGoal = {
      id: crypto.randomUUID(),
      ...newGoal,
    };
    onUpdateGoals([...goals, goal]);
    setNewGoal({ name: '', type: 'minimum', targetAmount: 0, currentAmount: 0, priority: 1 });
    setIsAddingGoal(false);
  }

  function removeGoal(id: string) {
    onUpdateGoals(goals.filter((g) => g.id !== id));
  }

  function updateGoal(id: string, updates: Partial<SavingsGoal>) {
    onUpdateGoals(goals.map((g) => (g.id === id ? { ...g, ...updates } : g)));
  }

  function addProject() {
    if (!newProject.name || !newProject.targetDate || newProject.targetAmount === 0) return;
    const project: SavingsProject = {
      id: crypto.randomUUID(),
      ...newProject,
    };
    onUpdateProjects([...projects, project]);
    setNewProject({
      name: '',
      targetAmount: 0,
      currentAmount: 0,
      targetDate: '',
      monthlyContribution: 0,
    });
    setIsAddingProject(false);
  }

  function removeProject(id: string) {
    onUpdateProjects(projects.filter((p) => p.id !== id));
  }

  // Note: updateProject is available for future use but not currently called in the UI
  // function updateProject(id: string, updates: Partial<SavingsProject>) {
  //   onUpdateProjects(projects.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  // }

  const totalGoalsTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalGoalsCurrent = goals.reduce((sum, g) => sum + g.currentAmount, 0);

  const totalProjectsTarget = projects.reduce((sum, p) => sum + p.targetAmount, 0);
  const totalProjectsCurrent = projects.reduce((sum, p) => sum + p.currentAmount, 0);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Épargne avancée</h2>

      {/* Tabs */}
      <div className="flex border-b mb-4">
        <button
          onClick={() => setActiveTab('goals')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'goals'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Objectifs d'épargne ({goals.length})
        </button>
        <button
          onClick={() => setActiveTab('projects')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'projects'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Projets ({projects.length})
        </button>
      </div>

      {/* Goals Tab */}
      {activeTab === 'goals' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">
                Total actuel: <strong>{currency(totalGoalsCurrent)}</strong> /{' '}
                <strong>{currency(totalGoalsTarget)}</strong>
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{
                    width: `${totalGoalsTarget > 0 ? (totalGoalsCurrent / totalGoalsTarget) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
            <button
              onClick={() => setIsAddingGoal(!isAddingGoal)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {isAddingGoal ? 'Annuler' : '+ Ajouter un objectif'}
            </button>
          </div>

          {isAddingGoal && (
            <div className="p-4 border rounded-lg bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nom</label>
                  <input
                    type="text"
                    value={newGoal.name}
                    onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                    placeholder="Ex: Épargne de précaution"
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select
                    value={newGoal.type}
                    onChange={(e) => setNewGoal({ ...newGoal, type: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded"
                  >
                    <option value="minimum">Épargne minimale</option>
                    <option value="precaution">Épargne de précaution</option>
                    <option value="project">Projet</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Montant cible (€)</label>
                  <input
                    type="number"
                    value={newGoal.targetAmount || ''}
                    onChange={(e) =>
                      setNewGoal({ ...newGoal, targetAmount: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Montant actuel (€)</label>
                  <input
                    type="number"
                    value={newGoal.currentAmount || ''}
                    onChange={(e) =>
                      setNewGoal({ ...newGoal, currentAmount: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Priorité (1-10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newGoal.priority}
                    onChange={(e) =>
                      setNewGoal({ ...newGoal, priority: parseInt(e.target.value) || 1 })
                    }
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const rec = await MLApi.recommendGoal(newGoal.type, 12);
                      if (rec.recommended_amount) {
                        setNewGoal({ ...newGoal, targetAmount: rec.recommended_amount });
                      }
                    } catch (err) {
                      console.error('Erreur recommandation IA:', err);
                    }
                  }}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
                >
                  🤖 IA: Recommandation Montant
                </button>
                <button
                  onClick={addGoal}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Ajouter
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {goals
              .sort((a, b) => b.priority - a.priority)
              .map((goal) => (
                <div key={goal.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-medium">{goal.name}</div>
                      <div className="text-sm text-gray-600 capitalize">{goal.type}</div>
                    </div>
                    <button
                      onClick={() => removeGoal(goal.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Supprimer
                    </button>
                  </div>
                  <div className="mb-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span>{currency(goal.currentAmount)}</span>
                      <span>{currency(goal.targetAmount)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      value={goal.currentAmount || 0}
                      onChange={(e) =>
                        updateGoal(goal.id, { currentAmount: parseFloat(e.target.value) || 0 })
                      }
                      placeholder="Montant actuel"
                      className="px-2 py-1 border rounded text-sm"
                    />
                    <select
                      value={goal.priority}
                      onChange={(e) =>
                        updateGoal(goal.id, { priority: parseInt(e.target.value) })
                      }
                      className="px-2 py-1 border rounded text-sm"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((p) => (
                        <option key={p} value={p}>
                          Priorité {p}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Projects Tab */}
      {activeTab === 'projects' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">
                Total actuel: <strong>{currency(totalProjectsCurrent)}</strong> /{' '}
                <strong>{currency(totalProjectsTarget)}</strong>
              </p>
            </div>
            <button
              onClick={() => setIsAddingProject(!isAddingProject)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {isAddingProject ? 'Annuler' : '+ Ajouter un projet'}
            </button>
          </div>

          {isAddingProject && (
            <div className="p-4 border rounded-lg bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nom du projet</label>
                  <input
                    type="text"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    placeholder="Ex: Vacances, Voiture"
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date cible</label>
                  <input
                    type="date"
                    value={newProject.targetDate}
                    onChange={(e) => setNewProject({ ...newProject, targetDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Montant cible (€)</label>
                  <input
                    type="number"
                    value={newProject.targetAmount || ''}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        targetAmount: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Montant actuel (€)</label>
                  <input
                    type="number"
                    value={newProject.currentAmount || ''}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        currentAmount: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">
                    Contribution mensuelle (€)
                  </label>
                  <input
                    type="number"
                    value={newProject.monthlyContribution || ''}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        monthlyContribution: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border rounded"
                  />
                  {newProject.targetDate &&
                    newProject.monthlyContribution > 0 &&
                    newProject.targetAmount > 0 && (
                      <p className="text-xs text-gray-600 mt-1">
                        Vous devrez économiser{' '}
                        {currency(newProject.targetAmount / newProject.monthlyContribution)}{' '}
                        par mois pour atteindre l'objectif.
                      </p>
                    )}
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                {newProject.targetAmount > 0 && newProject.targetDate && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const rec = await MLApi.recommendContribution(
                          newProject.targetAmount,
                          newProject.targetDate,
                          newProject.currentAmount
                        );
                        if (rec.monthly_contribution !== undefined) {
                          setNewProject({ ...newProject, monthlyContribution: rec.monthly_contribution });
                        }
                      } catch (err) {
                        console.error('Erreur recommandation IA:', err);
                      }
                    }}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
                  >
                    🤖 IA: Recommandation Contribution
                  </button>
                )}
                {newProject.targetAmount > 0 && newProject.monthlyContribution > 0 && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const rec = await MLApi.recommendDate(
                          newProject.targetAmount,
                          newProject.monthlyContribution,
                          newProject.currentAmount
                        );
                        if (rec.target_date) {
                          setNewProject({ ...newProject, targetDate: rec.target_date.split('T')[0] });
                        }
                      } catch (err) {
                        console.error('Erreur recommandation IA:', err);
                      }
                    }}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
                  >
                    🤖 IA: Recommandation Date
                  </button>
                )}
              </div>
              <button
                onClick={addProject}
                className="mt-3 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Ajouter
              </button>
            </div>
          )}

          <div className="space-y-2">
            {projects.map((project) => {
              const targetDate = new Date(project.targetDate);
              const monthsRemaining =
                (targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30);
              const requiredMonthly =
                monthsRemaining > 0
                  ? (project.targetAmount - project.currentAmount) / monthsRemaining
                  : 0;

              return (
                <div key={project.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-medium">{project.name}</div>
                      <div className="text-sm text-gray-600">
                        Date cible: {targetDate.toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                    <button
                      onClick={() => removeProject(project.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Supprimer
                    </button>
                  </div>
                  <div className="mb-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span>{currency(project.currentAmount)}</span>
                      <span>{currency(project.targetAmount)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{
                          width: `${
                            project.targetAmount > 0
                              ? (project.currentAmount / project.targetAmount) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Contribution mensuelle:</span>
                      <span className="font-medium">{currency(project.monthlyContribution)}</span>
                    </div>
                    {monthsRemaining > 0 && (
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Nécessaire par mois:</span>
                        <span>
                          {currency(requiredMonthly)} ({monthsRemaining.toFixed(1)} mois restants)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

