import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/workspace/$workspaceId/providers")({
	component: RouteComponent,
});

function RouteComponent() {
	return <div>Hello "/_app/workspace/$workspaceId/providers"!</div>;
}
