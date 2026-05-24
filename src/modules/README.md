# Frontend Modules

This directory contains the feature modules for the School SaaS Admin frontend. The architecture is modular to closely match the NestJS backend structure and keep code highly cohesive.

## Module Structure

Each module (e.g., `student`, `fee`, `hr-payroll`) should have the following internal structure:

```
src/modules/[module-name]/
├── api/             # Axios API calls specific to this module
├── hooks/           # TanStack Query custom hooks (e.g., useStudents, useFeeStructures)
├── components/      # React components specific to this module
├── types/           # TypeScript interfaces and types
└── store/           # (Optional) Zustand stores for module-specific client state
```

### Example: TanStack Query Hook (`src/modules/student/hooks/useStudents.ts`)

```typescript
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

export function useStudents(classId?: string) {
  return useQuery({
    queryKey: ['students', classId],
    queryFn: async () => {
      const res = await api.get('/student', { params: { classId } });
      return res.data;
    },
  });
}
```

### Example: API Call (`src/modules/student/api/index.ts`)

```typescript
import { api } from '@/services/api';

export const fetchStudentDetails = async (id: string) => {
  const { data } = await api.get(`/student/${id}`);
  return data;
};
```
