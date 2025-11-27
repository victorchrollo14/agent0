import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
	"/_app/workspace/$workspaceId/providers/$providerId",
)({
	component: RouteComponent,
});

function RouteComponent() {
	return <div>Provider</div>;
}
