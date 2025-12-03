import { useState } from 'react';
import { SharedExpensePerson, PersonTransaction } from '../../core/types';
import { currency, toISODate, today } from '../../lib/utils';

interface SharedExpensesManagerProps {
  persons: SharedExpensePerson[];
  transactions: PersonTransaction[];
  onUpdatePersons: (persons: SharedExpensePerson[]) => void;
  onUpdateTransactions: (transactions: PersonTransaction[]) => void;
}

export function SharedExpensesManager({
  persons,
  transactions,
  onUpdatePersons,
  onUpdateTransactions,
}: SharedExpensesManagerProps) {
  const [activeTab, setActiveTab] = useState<'persons' | 'transactions'>('persons');
  const [isAddingPerson, setIsAddingPerson] = useState(false);
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);

  const [newPerson, setNewPerson] = useState({
    name: '',
    defaultSharePercentage: 50,
    note: '',
  });

  const [newTransaction, setNewTransaction] = useState({
    person: '',
    amount: 0,
    type: 'reimbursement' as 'reimbursement' | 'payment' | 'transfer',
    description: '',
    date: toISODate(today),
  });

  function addPerson() {
    if (!newPerson.name) return;
    const person: SharedExpensePerson = {
      id: crypto.randomUUID(),
      ...newPerson,
    };
    onUpdatePersons([...persons, person]);
    setNewPerson({ name: '', defaultSharePercentage: 50, note: '' });
    setIsAddingPerson(false);
  }

  function removePerson(id: string) {
    onUpdatePersons(persons.filter((p) => p.id !== id));
  }

  function addTransaction() {
    if (!newTransaction.person || !newTransaction.description || newTransaction.amount === 0) return;
    const transaction: PersonTransaction = {
      id: crypto.randomUUID(),
      ...newTransaction,
      amount: newTransaction.type === 'reimbursement' ? Math.abs(newTransaction.amount) : -Math.abs(newTransaction.amount),
    };
    onUpdateTransactions([...transactions, transaction]);
    setNewTransaction({ person: '', amount: 0, type: 'reimbursement', description: '', date: toISODate(today) });
    setIsAddingTransaction(false);
  }

  function removeTransaction(id: string) {
    onUpdateTransactions(transactions.filter((t) => t.id !== id));
  }

  // Calculate balances with each person
  const personBalances = new Map<string, number>();
  persons.forEach((person) => {
    const balance = transactions
      .filter((t) => t.person === person.name)
      .reduce((sum, t) => sum + t.amount, 0);
    personBalances.set(person.name, balance);
  });

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Gestion des dépenses partagées</h2>

      {/* Tabs */}
      <div className="flex border-b mb-4">
        <button
          onClick={() => setActiveTab('persons')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'persons'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Personnes ({persons.length})
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'transactions'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Transactions ({transactions.length})
        </button>
      </div>

      {/* Persons Tab */}
      {activeTab === 'persons' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Personnes avec qui vous partagez des dépenses
            </p>
            <button
              onClick={() => setIsAddingPerson(!isAddingPerson)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {isAddingPerson ? 'Annuler' : '+ Ajouter une personne'}
            </button>
          </div>

          {isAddingPerson && (
            <div className="p-4 border rounded-lg bg-gray-50">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Nom</label>
                  <input
                    type="text"
                    value={newPerson.name}
                    onChange={(e) => setNewPerson({ ...newPerson, name: e.target.value })}
                    placeholder="Ex: Petite amie, Colloc, etc."
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Part par défaut (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newPerson.defaultSharePercentage}
                    onChange={(e) =>
                      setNewPerson({
                        ...newPerson,
                        defaultSharePercentage: parseInt(e.target.value) || 50,
                      })
                    }
                    className="w-full px-3 py-2 border rounded"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Pourcentage que vous payez par défaut (ex: 50 pour 50%)
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Note (optionnel)</label>
                  <input
                    type="text"
                    value={newPerson.note}
                    onChange={(e) => setNewPerson({ ...newPerson, note: e.target.value })}
                    placeholder="Informations complémentaires"
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <button
                  onClick={addPerson}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Ajouter
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {persons.map((person) => {
              const balance = personBalances.get(person.name) || 0;
              return (
                <div
                  key={person.id}
                  className="p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-medium">{person.name}</div>
                      <div className="text-sm text-gray-600">
                        Partage par défaut: {person.defaultSharePercentage}%
                      </div>
                      {person.note && (
                        <div className="text-xs text-gray-500">{person.note}</div>
                      )}
                    </div>
                    <button
                      onClick={() => removePerson(person.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Supprimer
                    </button>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Solde actuel:</span>
                      <span className={`font-semibold ${balance > 0 ? 'text-green-600' : balance < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                        {balance > 0 ? '+' : ''}{currency(balance)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {balance > 0
                        ? 'Vous devez recevoir'
                        : balance < 0
                        ? 'Vous devez payer'
                        : 'Équilibré'}
                    </div>
                  </div>
                </div>
              );
            })}
            {persons.length === 0 && (
              <p className="text-gray-500 text-center py-8">
                Aucune personne ajoutée. Cliquez sur "Ajouter une personne" pour commencer.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Remboursements, paiements et transferts
            </p>
            <button
              onClick={() => setIsAddingTransaction(!isAddingTransaction)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {isAddingTransaction ? 'Annuler' : '+ Ajouter une transaction'}
            </button>
          </div>

          {isAddingTransaction && (
            <div className="p-4 border rounded-lg bg-gray-50">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Personne</label>
                  <select
                    value={newTransaction.person}
                    onChange={(e) => setNewTransaction({ ...newTransaction, person: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                  >
                    <option value="">Sélectionner une personne</option>
                    {persons.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select
                    value={newTransaction.type}
                    onChange={(e) =>
                      setNewTransaction({
                        ...newTransaction,
                        type: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 border rounded"
                  >
                    <option value="reimbursement">Remboursement reçu (+)</option>
                    <option value="payment">Paiement fait (-)</option>
                    <option value="transfer">Transfert (-)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Montant (€)</label>
                  <input
                    type="number"
                    value={newTransaction.amount || ''}
                    onChange={(e) =>
                      setNewTransaction({
                        ...newTransaction,
                        amount: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <input
                    type="text"
                    value={newTransaction.description}
                    onChange={(e) =>
                      setNewTransaction({ ...newTransaction, description: e.target.value })
                    }
                    placeholder="Ex: Remboursement loyer janvier"
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <input
                    type="date"
                    value={newTransaction.date}
                    onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <button
                  onClick={addTransaction}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Ajouter
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {transactions
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((transaction) => (
                <div
                  key={transaction.id}
                  className="p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{transaction.person}</div>
                      <div className="text-sm text-gray-600">{transaction.description}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(transaction.date).toLocaleDateString('fr-FR')} •{' '}
                        {transaction.type === 'reimbursement'
                          ? 'Remboursement reçu'
                          : transaction.type === 'payment'
                          ? 'Paiement fait'
                          : 'Transfert'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-semibold ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {transaction.amount > 0 ? '+' : ''}{currency(transaction.amount)}
                      </span>
                      <button
                        onClick={() => removeTransaction(transaction.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            {transactions.length === 0 && (
              <p className="text-gray-500 text-center py-8">
                Aucune transaction enregistrée. Cliquez sur "Ajouter une transaction" pour commencer.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

