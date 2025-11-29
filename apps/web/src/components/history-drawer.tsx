import {
	Avatar,
	Card,
	CardBody,
	CardHeader,
	Chip,
	Drawer,
	DrawerBody,
	DrawerContent,
	DrawerHeader,
} from "@heroui/react";
import type { Tables } from "@repo/database";
import { format } from "date-fns";

interface HistoryDrawerProps {
	isOpen: boolean;
	onOpenChange: () => void;
	versions: Tables<"versions">[];
	onSelectionChange: (version: Tables<"versions">) => void;
}

export const HistoryDrawer = ({
	isOpen,
	onOpenChange,
	versions,
	onSelectionChange,
}: HistoryDrawerProps) => {
	return (
		<Drawer
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			title="History"
			scrollBehavior="inside"
		>
			<DrawerContent>
				<DrawerHeader>Version History</DrawerHeader>
				<DrawerBody className="pb-6">
					{versions.map((version) => (
						<Card
							className="shrink-0"
							key={version.id}
							isPressable
							onPress={() => {
								onSelectionChange(version);
								onOpenChange();
							}}
						>
							<CardHeader className="flex items-center justify-between">
								<p className="text-sm text-default-500">#{version.id}</p>

								{version.is_deployed && (
									<Chip color="success" size="sm">
										PUBLISHED
									</Chip>
								)}
							</CardHeader>
							<CardBody className="gap-2">
								<p className="text-sm">
									{format(version.created_at, "d LLL, hh:mm a")}
								</p>
								<div className="flex gap-2 items-center">
									<Avatar size="sm" fallback="U">
										U
									</Avatar>
									<p className="text-sm">{version.user_id}</p>
								</div>
							</CardBody>
						</Card>
					))}
				</DrawerBody>
			</DrawerContent>
		</Drawer>
	);
};
