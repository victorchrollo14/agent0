import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/workspace/$workspaceId/runs")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="flex items-center justify-center h-full">
			<p className="text-3xl font-mono">Runs coming soon!</p>
		</div>
	);
}
