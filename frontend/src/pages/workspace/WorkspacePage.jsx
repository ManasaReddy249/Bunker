import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import InventoryPage from '../inventory/InventoryPage';
import PlanningPage from '../planning/PlanningPage';

const TABS = [
  { id: 'planning', label: 'Planning', roles: ['Administrator', 'Executive'] },
  { id: 'inventory', label: 'Inventory', roles: ['Administrator', 'Executive'] },
  { id: 'operations', label: 'Operations', roles: ['Administrator', 'Executive'] }
];

export default function WorkspacePage() {
  const { user } = useAuth();
  const tabs = TABS.filter((tab) => tab.roles.includes(user?.role));
  const [active, setActive] = useState('planning');
  const visibleTab = tabs.some((tab) => tab.id === active) ? active : tabs[0]?.id;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Operations Workspace</h1>
        <p className="text-sm text-slate-500">Planning, inventory and fuel operations</p>
      </div>
      {tabs.length > 1 && (
        <div className="inline-flex max-w-full overflow-x-auto rounded-lg border border-slate-300 bg-white p-1" role="tablist" aria-label="Operations views">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={visibleTab === tab.id}
              className={`shrink-0 rounded-md px-4 py-2 text-sm font-medium ${visibleTab === tab.id ? 'bg-navy text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              onClick={() => setActive(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}
      <section role="tabpanel">
        {visibleTab === 'planning' && <PlanningPage />}
        {visibleTab === 'inventory' && <InventoryPage view="inventory" />}
        {visibleTab === 'operations' && <InventoryPage view="operations" />}
      </section>
    </div>
  );
}
