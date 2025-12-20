import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Settings as SettingsIcon, UserPlus, Pencil, Trash2, Shield, User } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface User {
    id: number;
    username: string;
    full_name: string;
    role: 'admin' | 'user';
    created_at: string;
    last_login: string | null;
}

export default function Settings() {
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    // Form states
    const [newUser, setNewUser] = useState({
        username: '',
        password: '',
        full_name: '',
        role: 'user' as 'admin' | 'user'
    });

    const [editUser, setEditUser] = useState({
        full_name: '',
        role: 'user' as 'admin' | 'user',
        password: ''
    });

    const getAuthHeaders = () => {
        const token = localStorage.getItem('auth_token');
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    };

    // Check if user is admin
    const isAdmin = localStorage.getItem('role') === 'admin';

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <main className="container mx-auto px-4 py-8">
                    <div className="glass-card p-6 text-center">
                        <Shield className="w-12 h-12 text-destructive mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-foreground mb-2">Access Denied</h2>
                        <p className="text-muted-foreground mb-4">You need administrator privileges to access this page.</p>
                        <Button onClick={() => navigate('/')}>Go to Home</Button>
                    </div>
                </main>
            </div>
        );
    }

    const { data: users, isLoading } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const hostname = window.location.hostname;
            const response = await fetch(`http://${hostname}:3000/api/users`, {
                headers: getAuthHeaders()
            });
            if (!response.ok) throw new Error('Failed to fetch users');
            return response.json() as Promise<User[]>;
        }
    });

    const createMutation = useMutation({
        mutationFn: async () => {
            const hostname = window.location.hostname;
            const response = await fetch(`http://${hostname}:3000/api/users`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(newUser)
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create user');
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setIsCreateDialogOpen(false);
            setNewUser({ username: '', password: '', full_name: '', role: 'user' });
            toast.success('User created successfully!');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to create user');
        }
    });

    const updateMutation = useMutation({
        mutationFn: async () => {
            if (!selectedUser) return;
            const hostname = window.location.hostname;
            const response = await fetch(`http://${hostname}:3000/api/users/${selectedUser.id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(editUser)
            });
            if (!response.ok) throw new Error('Failed to update user');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setIsEditDialogOpen(false);
            setSelectedUser(null);
            setEditUser({ full_name: '', role: 'user', password: '' });
            toast.success('User updated successfully!');
        },
        onError: () => {
            toast.error('Failed to update user');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (userId: number) => {
            const hostname = window.location.hostname;
            const response = await fetch(`http://${hostname}:3000/api/users/${userId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete user');
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('User deleted successfully!');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to delete user');
        }
    });

    const handleEdit = (user: User) => {
        setSelectedUser(user);
        setEditUser({
            full_name: user.full_name,
            role: user.role,
            password: ''
        });
        setIsEditDialogOpen(true);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <main className="container mx-auto px-4 py-8">
                    <div className="text-center">Loading...</div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container mx-auto px-4 py-8">
                <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/20 glow-primary">
                                <SettingsIcon className="w-6 h-6 text-primary" />
                            </div>
                            <h1 className="text-2xl font-bold text-foreground">Settings</h1>
                        </div>

                        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="gap-2">
                                    <UserPlus className="w-4 h-4" />
                                    Add User
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Create New User</DialogTitle>
                                    <DialogDescription>Add a new user to the system</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="new-username">Username</Label>
                                        <Input
                                            id="new-username"
                                            value={newUser.username}
                                            onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                                            placeholder="Enter username"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="new-password">Password</Label>
                                        <Input
                                            id="new-password"
                                            type="password"
                                            value={newUser.password}
                                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                            placeholder="Enter password"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="new-fullname">Full Name</Label>
                                        <Input
                                            id="new-fullname"
                                            value={newUser.full_name}
                                            onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                                            placeholder="Enter full name"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="new-role">Role</Label>
                                        <Select
                                            value={newUser.role}
                                            onValueChange={(value: 'admin' | 'user') => setNewUser({ ...newUser, role: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="user">User</SelectItem>
                                                <SelectItem value="admin">Admin</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
                                        {createMutation.isPending ? 'Creating...' : 'Create User'}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {/* Users Table */}
                    <div className="bg-card/50 rounded-lg border border-border overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-secondary/50">
                                <tr>
                                    <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Username</th>
                                    <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Full Name</th>
                                    <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Role</th>
                                    <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Last Login</th>
                                    <th className="text-right p-4 text-sm font-semibold text-muted-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users?.map((user) => (
                                    <tr key={user.id} className="border-t border-border/30">
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                {user.role === 'admin' ? (
                                                    <Shield className="w-4 h-4 text-primary" />
                                                ) : (
                                                    <User className="w-4 h-4 text-muted-foreground" />
                                                )}
                                                <span className="font-medium">{user.username}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">{user.full_name}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                user.role === 'admin' 
                                                    ? 'bg-primary/20 text-primary' 
                                                    : 'bg-secondary text-muted-foreground'
                                            }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-muted-foreground">
                                            {user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEdit(user)}
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="sm">
                                                            <Trash2 className="w-4 h-4 text-destructive" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Delete User</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Are you sure you want to delete {user.username}? This action cannot be undone.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => deleteMutation.mutate(user.id)}
                                                                className="bg-destructive text-destructive-foreground"
                                                            >
                                                                Delete
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Edit User Dialog */}
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit User</DialogTitle>
                            <DialogDescription>Update user information</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="edit-fullname">Full Name</Label>
                                <Input
                                    id="edit-fullname"
                                    value={editUser.full_name}
                                    onChange={(e) => setEditUser({ ...editUser, full_name: e.target.value })}
                                    placeholder="Enter full name"
                                />
                            </div>
                            <div>
                                <Label htmlFor="edit-role">Role</Label>
                                <Select
                                    value={editUser.role}
                                    onValueChange={(value: 'admin' | 'user') => setEditUser({ ...editUser, role: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="user">User</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="edit-password">New Password (optional)</Label>
                                <Input
                                    id="edit-password"
                                    type="password"
                                    value={editUser.password}
                                    onChange={(e) => setEditUser({ ...editUser, password: e.target.value })}
                                    placeholder="Leave blank to keep current password"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
                                {updateMutation.isPending ? 'Updating...' : 'Update User'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </main>
        </div>
    );
}
