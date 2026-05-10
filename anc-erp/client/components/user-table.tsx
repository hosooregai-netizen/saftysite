"use client";

import { useState, useTransition } from "react";

import type { AdminUser, Role } from "../../packages/contracts/src";
import { createAdminUserAction, updateAdminUserAction } from "../lib/admin-actions";
import { UserRoleSelector, UserStatusBadge } from "./admin-governance-components";
import { StatusBadge } from "./status-badge";

type UserTableProps = {
  users: AdminUser[];
  roles: Role[];
};

export function UserTable({ users, roles }: UserTableProps) {
  const [message, setMessage] = useState("계정 관리");
  const [isPending, startTransition] = useTransition();

  return (
    <section className="panel">
      <div className="card-head">
        <div>
          <p className="card-eyebrow">UserTable</p>
          <h3 className="panel-title">관리자 계정</h3>
        </div>
        <StatusBadge tone={isPending ? "warning" : "review"} label={message} />
      </div>
      <div className="utility-row" style={{ justifyContent: "flex-start", marginBottom: 16 }}>
        <button
          className="inline-link button-reset"
          onClick={() =>
            startTransition(async () => {
              try {
                await createAdminUserAction({
                  name: "초안 관리자",
                  email: "draft-admin@anc.local",
                  status: "invited",
                  roleIds: [roles[0]?.id].filter(Boolean),
                  projectAccessPolicy: "all",
                });
                setMessage("POST /admin/users");
              } catch {
                setMessage("계정 생성 대기");
              }
            })
          }
          type="button"
        >
          초안 계정 생성
        </button>
      </div>
      <div className="data-table">
        <div className="table-row table-head">
          <span>이름</span>
          <span>이메일</span>
          <span>상태</span>
        </div>
        {users.map((user) => (
          <div className="table-row" key={user.id}>
            <span className="approval-table-document">
              <strong>{user.name}</strong>
              <small>{user.department ?? "부서 미지정"} / {user.position ?? "직책 미지정"}</small>
              <UserRoleSelector roleIds={user.roleIds} roles={roles} />
            </span>
            <span>{user.email}</span>
            <span>
              <button
                className="inline-link button-reset"
                onClick={() =>
                  startTransition(async () => {
                    try {
                      await updateAdminUserAction(user.id, {
                        status: user.status === "active" ? "disabled" : "active",
                      });
                      setMessage(`PATCH /admin/users/${user.id}`);
                    } catch {
                      setMessage("계정 상태 변경 대기");
                    }
                  })
                }
                type="button"
              >
                <UserStatusBadge status={user.status} />
              </button>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
