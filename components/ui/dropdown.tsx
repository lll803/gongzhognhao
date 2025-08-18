"use client"

import * as React from "react"
import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu"
import { cn } from "@/lib/utils"

const DropdownMenu = DropdownPrimitive.Root
const DropdownMenuTrigger = DropdownPrimitive.Trigger
const DropdownMenuGroup = DropdownPrimitive.Group
const DropdownMenuPortal = DropdownPrimitive.Portal
const DropdownMenuSub = DropdownPrimitive.Sub
const DropdownMenuRadioGroup = DropdownPrimitive.RadioGroup

const DropdownMenuContent = React.forwardRef<
	React.ElementRef<typeof DropdownPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
	<DropdownPrimitive.Portal>
		<DropdownPrimitive.Content
			ref={ref}
			sideOffset={sideOffset}
			className={cn(
				"z-50 min-w-[10rem] overflow-hidden rounded-md border bg-background p-1 shadow-md",
				className
			)}
			{...props}
		/>
	</DropdownPrimitive.Portal>
))
DropdownMenuContent.displayName = DropdownPrimitive.Content.displayName

const DropdownMenuItem = React.forwardRef<
	React.ElementRef<typeof DropdownPrimitive.Item>,
	React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Item>
>(({ className, inset, ...props }: { inset?: boolean } & React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Item>, ref) => (
	<DropdownPrimitive.Item
		ref={ref}
		className={cn(
			"relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
			"focus:bg-accent/10 focus:text-foreground",
			inset && "pl-8",
			className
		)}
		{...props}
	/>
))
DropdownMenuItem.displayName = DropdownPrimitive.Item.displayName

export {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuGroup,
	DropdownMenuPortal,
	DropdownMenuSub,
	DropdownMenuRadioGroup
} 