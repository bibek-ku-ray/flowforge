"use client"

import {useTRPC} from "@/trpc/client";
import {useSuspenseQuery} from "@tanstack/react-query";

const Client = () => {

    const trpc = useTRPC();
    const {data: users} = useSuspenseQuery(trpc.getUsers.queryOptions())

    return (
        <div>
            <pre
                className="max-w-3xl overflow-auto rounded-md bg-white p-4 text-xs text-zinc-900 shadow dark:bg-zinc-900 dark:text-zinc-100">
                    {JSON.stringify(users)}
            </pre>
        </div>
    );
};

export default Client;