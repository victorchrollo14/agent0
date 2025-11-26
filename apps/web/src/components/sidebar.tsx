import {
	Button,
	Dropdown,
	DropdownItem,
	DropdownMenu,
	DropdownTrigger,
} from "@heroui/react";
import {
	Bot,
	LayoutDashboard,
	LucideChevronsUpDown,
	PlayCircle,
	Server,
} from "lucide-react";

interface SidebarProps {
	workspaceId: string;
}

export function Sidebar({ workspaceId }: SidebarProps) {
	const navItems = [
		{
			label: "Dashboard",
			icon: LayoutDashboard,
			path: `/workspace/${workspaceId}`,
			disabled: true,
		},
		{
			label: "Providers",
			icon: Server,
			path: `/workspace/${workspaceId}/providers`,
			disabled: true,
		},
		{
			label: "Agents",
			icon: Bot,
			path: `/workspace/${workspaceId}/agents`,
			disabled: true,
		},
		{
			label: "Runs",
			icon: PlayCircle,
			path: `/workspace/${workspaceId}/runs`,
			disabled: true,
		},
	];

	return (
		<div className={`border-r border-default-200 flex flex-col w-64`}>
			<div className="border-b border-default-200">
				<Dropdown classNames={{ trigger: "scale-100!" }}>
					<DropdownTrigger>
						<div className="w-full flex justify-between items-center px-4 h-16 hover:bg-default-100 cursor-pointer">
							<div>
								<span className="block text-[10px] text-default-500 leading-tight">
									WORKSPACE
								</span>
								<span className="font-medium">Agent0</span>
							</div>
							<LucideChevronsUpDown className="size-4" />
						</div>
					</DropdownTrigger>
					<DropdownMenu aria-label="Workspace selection">
						<DropdownItem key="agent0">Agent0</DropdownItem>
					</DropdownMenu>
				</Dropdown>
			</div>

			<nav className="flex-1 py-4 px-1.5 space-y-1 overflow-y-auto">
				{navItems.map((item) => {
					const Icon = item.icon;

					return (
						<Button
							key={item.label}
							variant="light"
							className="w-full justify-start px-2.5"
							startContent={<Icon className="size-5" />}
						>
							{item.label}
						</Button>
					);
				})}
			</nav>

			<div className="border-t border-default-200">
				{/* TODO: Implement user menu here */}
			</div>
		</div>
	);
}
