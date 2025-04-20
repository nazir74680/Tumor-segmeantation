export const ROLES = {
    ADMIN: 'admin',
    USER: 'user'
};

export const mockUsers = [
    {
        id: '1',
        email: 'admin@example.com',
        password: 'admin123',
        name: 'Admin User',
        role: ROLES.ADMIN
    },
    {
        id: '2',
        email: 'user@example.com',
        password: 'user123',
        name: 'Demo User',
        role: ROLES.USER
    }
];
