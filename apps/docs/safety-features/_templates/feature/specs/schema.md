# Schema: <Feature Name>

## Frontend types

```ts
export type ExampleRecord = {
  id: string;
  createdAt: string;
  updatedAt: string;
};
```

## Backend models

```python
class ExampleModel(BaseModel):
    id: str
```

## Naming compatibility

| Backend | Frontend | 비고 |
|---|---|---|
| `created_at` | `createdAt` | snake_case → camelCase |

## Legacy fields

| Field | Status | Migration |
|---|---|---|
|  |  |  |
