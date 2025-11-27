import { Spinner } from "@heroui/react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="h-screen w-screen flex justify-center items-center">
			<Spinner />
		</div>
	);
}
