// Global styling utilities and CSS-in-JS helpers
import { themeConfig } from './theme-config.js';

// CSS class generators for consistent styling
export const css = {
	// Layout utilities
	container: (size = 'default') => {
		const sizes = {
			default: 'container mx-auto px-0',
			fluid: 'container-fluid',
			constrained: 'container mx-auto px-4'
		};
		return sizes[size];
	},
	
	// Flexbox utilities
	flex: {
		center: 'd-flex justify-content-center align-items-center',
		between: 'd-flex justify-content-between align-items-center',
		start: 'd-flex justify-content-start align-items-center',
		end: 'd-flex justify-content-end align-items-center',
		column: 'd-flex flex-column',
		wrap: 'd-flex flex-wrap'
	},
	
	// Spacing utilities
	spacing: {
		none: 'm-0 p-0',
		xs: 'p-1',
		sm: 'p-2',
		md: 'p-3',
		lg: 'p-4',
		xl: 'p-5'
	},
	
	// Typography utilities
	text: {
		heading: 'text-strong fw-bold',
		subheading: 'text-primary fw-semibold',
		body: 'text-color',
		muted: 'text-light',
		accent: 'erg-span',
		center: 'text-center',
		left: 'text-start',
		right: 'text-end'
	},
	
	// Component-specific styles
	card: {
		default: 'div-cell',
		dark: 'div-cell-dark',
		summary: 'div-summary',
		bordered: 'border-no-flat'
	},
	
	table: {
		default: 'table table-dark table-striped',
		responsive: 'table-responsive',
		bordered: 'table-bordered'
	},
	
	// Interactive elements
	button: {
		primary: 'btn btn-primary',
		secondary: 'btn btn-secondary',
		info: 'btn btn-info',
		outline: 'btn btn-outline-primary',
		link: 'btn btn-link'
	},
	
	// Form elements
	form: {
		control: 'form-control',
		select: 'form-select',
		check: 'form-check-input',
		label: 'form-label'
	}
};

// Style composition helpers
export const compose = (...classes) => {
	return classes.filter(Boolean).join(' ');
};

// Responsive breakpoint helpers
export const breakpoints = {
	xs: '(max-width: 575.98px)',
	sm: '(min-width: 576px)',
	md: '(min-width: 768px)',
	lg: '(min-width: 992px)',
	xl: '(min-width: 1200px)',
	xxl: '(min-width: 1400px)'
};

// Theme-aware style generator
export const createThemeStyles = (theme) => {
	const config = themeConfig.themes[theme] || themeConfig.themes.light;
	
	return {
		background: config.background,
		surface: config.surface,
		text: config.text,
		borders: config.borders,
		primary: config.primary || themeConfig.colors.primary,
		primaryHover: config.primaryHover || themeConfig.colors.primaryHover
	};
};

// Animation utilities
export const animations = {
	spin: 'loading-spinner',
	fadeIn: 'fade-in',
	slideIn: 'slide-in',
	bounce: 'bounce'
};

// Common style patterns
export const patterns = {
	// Card with hover effect
	hoverCard: compose(
		css.card.default,
		'transition-all duration-200 hover:shadow-md cursor-pointer'
	),
	
	// Glass effect cards
	glassCard: compose(
		'glass',
		'u-rounded-md',
		'p-3',
		'u-transition'
	),
	
	glassCardSubtle: compose(
		'glass-subtle',
		'u-rounded-md',
		'p-3',
		'u-transition'
	),
	
	glassCardAccent: compose(
		'glass-accent',
		'u-rounded-md',
		'p-3',
		'u-transition'
	),
	
	// Enhanced navbar with glass
	glassNavbar: compose(
		'glass-subtle',
		'u-transition'
	),
	
	// Centered loading state
	loading: compose(
		css.flex.center,
		'min-h-48 text-muted'
	),
	
	// Error state
	error: compose(
		css.flex.center,
		'min-h-48 text-danger'
	),
	
	// Statistics display
	statCard: compose(
		css.card.summary,
		css.text.center,
		'mb-3'
	),
	
	// Glass statistics display
	glassStatCard: compose(
		'glass',
		css.text.center,
		'mb-3',
		'p-3',
		'u-rounded-md'
	),
	
	// Navigation item
	navItem: compose(
		'nav-link',
		'transition-colors duration-200'
	),
	
	// Data table
	dataTable: compose(
		css.table.default,
		css.table.responsive,
		'border-no-flat'
	),
	
	// Glass data table
	glassDataTable: compose(
		'glass-subtle',
		css.table.responsive,
		'u-rounded-md',
		'overflow-hidden'
	),
	
	// Glass table variants
	glassTableHeader: compose(
		'glass-accent',
		'u-font-semibold'
	),
	
	glassTableRow: compose(
		'glass-subtle',
		'u-transition'
	),
	
	// Glass pagination
	glassPagination: compose(
		'glass',
		'u-rounded',
		'd-flex justify-content-center'
	)
};