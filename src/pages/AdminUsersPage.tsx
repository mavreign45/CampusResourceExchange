import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { User, UserRole } from '../types/auth';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

export const AdminUsersPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);

  const isAdmin = user?.role === 'Admin';

  const fetchUsers = useCallback(async () => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await authService.listUsers();
      setUsers(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch campus users';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (targetUser: User, newRole: UserRole) => {
    if (targetUser.role === newRole) return;
    setUpdatingUserId(targetUser.id);
    setError(null);
    setSuccessMsg(null);
    try {
      await authService.updateUserRole(targetUser.id, newRole);
      setSuccessMsg(`Updated ${targetUser.full_name}'s role to ${newRole}.`);
      await fetchUsers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update user role';
      setError(msg);
    } finally {
      setUpdatingUserId(null);
    }
  };

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="py-12 px-4 max-w-xl mx-auto text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto mb-4 text-rose-600">
          <Shield className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">
          Administrator Access Required
        </h2>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          The User Management dashboard is strictly restricted to university administrators.
          Public users cannot view or alter user role assignments.
        </p>
      </div>
    );
  }

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'Admin':
        return <Badge variant="danger" size="sm">Admin</Badge>;
      case 'Lab Custodian':
        return <Badge variant="info" size="sm">Lab Custodian</Badge>;
      case 'Faculty Researcher':
        return <Badge variant="warning" size="sm">Faculty</Badge>;
      default:
        return <Badge variant="default" size="sm">Student</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Campus User & RBAC Management
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
              Admin Only
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage student roles, promote lab custodians, and oversee verified researcher permissions.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchUsers}
          disabled={loading}
          icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
        >
          Refresh Directory
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Users Table */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cyan-600 mb-2" />
          Loading user records...
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Email & Dept</th>
                  <th className="px-4 py-3">Current Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Change Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => {
                  const isCurrent = u.id === user?.id;
                  const isUpdating = updatingUserId === u.id;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center font-bold text-xs shrink-0">
                            {u.full_name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block leading-tight">
                              {u.full_name} {isCurrent && '(You)'}
                            </span>
                            {u.student_id && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                ID: {u.student_id}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="text-slate-800 font-medium block">{u.email}</span>
                        <span className="text-[11px] text-slate-400">
                          {u.department || 'General Campus'}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        {getRoleBadgeVariant(u.role)}
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                            u.is_active ? 'text-emerald-700' : 'text-slate-400'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.is_active ? 'bg-emerald-500' : 'bg-slate-300'
                            }`}
                          />
                          {u.is_active ? 'Active' : 'Suspended'}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="relative inline-block">
                          <select
                            disabled={isUpdating}
                            value={u.role}
                            onChange={(e) =>
                              handleRoleChange(u, e.target.value as UserRole)
                            }
                            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500 pr-7 cursor-pointer disabled:opacity-50"
                          >
                            <option value="Student">Student</option>
                            <option value="Faculty Researcher">Faculty Researcher</option>
                            <option value="Lab Custodian">Lab Custodian</option>
                            <option value="Admin">Admin</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
