import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { supabase } from "../lib/supabase";

export const Route = createFileRoute("/_app")({
	component: LayoutComponent,
	beforeLoad: async ({ location }) => {
		const {
			data: { session },
		} = await supabase.auth.getSession();
		if (!session) {
			throw redirect({ to: "/auth" });
		}

		// If user is at the root of the app, redirect to last accessed or first workspace
		if (location.pathname === "/") {
			const lastAccessedWorkspace = localStorage.getItem(
				"lastAccessedWorkspace",
			);

			if (lastAccessedWorkspace) {
				throw redirect({
					to: "/workspace/$workspaceId",
					params: { workspaceId: lastAccessedWorkspace },
				});
			}

			// Fetch workspaces
			const { data: workspace, error } = await supabase
				.from("workspaces")
				.select("id")
				.limit(1)
				.order("created_at", { ascending: true })
				.single();

			if (error) throw error;

			if (!workspace) {
				// No workspaces exist, redirect to create workspace
				throw redirect({ to: "/create-workspace" });
			}

			throw redirect({
				to: "/workspace/$workspaceId",
				params: {
					workspaceId: workspace.id,
				},
			});
		}
	},
});

function LayoutComponent() {
	return <Outlet />;
}
