/**
 * Layout Components for consistent application structure
 */

import React from 'react';
import './LayoutComponents.css';

// Container Component
interface ContainerProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}

export const Container: React.FC<ContainerProps> = ({
  children,
  size = 'lg',
  className = ''
}) => (
  <div className={`container container-${size} ${className}`.trim()}>
    {children}
  </div>
);

// Grid System
interface GridProps {
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4 | 6 | 12;
  gap?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
}

export const Grid: React.FC<GridProps> = ({
  children,
  cols = 1,
  gap = 'md',
  className = ''
}) => (
  <div className={`grid grid-cols-${cols} grid-gap-${gap} ${className}`.trim()}>
    {children}
  </div>
);

interface GridItemProps {
  children: React.ReactNode;
  span?: 1 | 2 | 3 | 4 | 6 | 12;
  className?: string;
}

export const GridItem: React.FC<GridItemProps> = ({
  children,
  span = 1,
  className = ''
}) => (
  <div className={`grid-item grid-span-${span} ${className}`.trim()}>
    {children}
  </div>
);

// Flex Components
interface FlexProps {
  children: React.ReactNode;
  direction?: 'row' | 'column';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  gap?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
}

export const Flex: React.FC<FlexProps> = ({
  children,
  direction = 'row',
  align = 'stretch',
  justify = 'start',
  wrap = 'nowrap',
  gap = 'none',
  className = ''
}) => {
  const classes = [
    'flex',
    `flex-${direction}`,
    `items-${align}`,
    `justify-${justify}`,
    `flex-${wrap}`,
    gap !== 'none' && `gap-${gap}`
  ].filter(Boolean).join(' ');

  return (
    <div className={`${classes} ${className}`.trim()}>
      {children}
    </div>
  );
};

// Stack Component (Vertical layout with consistent spacing)
interface StackProps {
  children: React.ReactNode;
  spacing?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  align?: 'start' | 'center' | 'end' | 'stretch';
  className?: string;
}

export const Stack: React.FC<StackProps> = ({
  children,
  spacing = 'md',
  align = 'stretch',
  className = ''
}) => (
  <div className={`stack stack-spacing-${spacing} stack-align-${align} ${className}`.trim()}>
    {children}
  </div>
);

// Section Component
interface SectionProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
}

export const Section: React.FC<SectionProps> = ({
  children,
  title,
  subtitle,
  actions,
  padding = 'md',
  className = ''
}) => (
  <section className={`section section-padding-${padding} ${className}`.trim()}>
    {(title || subtitle || actions) && (
      <div className="section-header">
        <div className="section-header-content">
          {title && <h2 className="section-title">{title}</h2>}
          {subtitle && <p className="section-subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="section-actions">{actions}</div>}
      </div>
    )}
    <div className="section-content">
      {children}
    </div>
  </section>
);

// Header Component
interface HeaderProps {
  children: React.ReactNode;
  sticky?: boolean;
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({
  children,
  sticky = false,
  className = ''
}) => (
  <header className={`header ${sticky ? 'header-sticky' : ''} ${className}`.trim()}>
    <Container>
      {children}
    </Container>
  </header>
);

// Main Content Area
interface MainProps {
  children: React.ReactNode;
  className?: string;
}

export const Main: React.FC<MainProps> = ({
  children,
  className = ''
}) => (
  <main className={`main ${className}`.trim()}>
    <Container>
      {children}
    </Container>
  </main>
);

// Footer Component
interface FooterProps {
  children: React.ReactNode;
  className?: string;
}

export const Footer: React.FC<FooterProps> = ({
  children,
  className = ''
}) => (
  <footer className={`footer ${className}`.trim()}>
    <Container>
      {children}
    </Container>
  </footer>
);

// Sidebar Component
interface SidebarProps {
  children: React.ReactNode;
  position?: 'left' | 'right';
  width?: 'sm' | 'md' | 'lg';
  collapsible?: boolean;
  isCollapsed?: boolean;
  onToggle?: () => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  children,
  position = 'left',
  width = 'md',
  collapsible = false,
  isCollapsed = false,
  onToggle,
  className = ''
}) => {
  const classes = [
    'sidebar',
    `sidebar-${position}`,
    `sidebar-${width}`,
    isCollapsed && 'sidebar-collapsed',
    collapsible && 'sidebar-collapsible'
  ].filter(Boolean).join(' ');

  return (
    <aside className={`${classes} ${className}`.trim()}>
      {collapsible && onToggle && (
        <button
          type="button"
          className="sidebar-toggle"
          onClick={onToggle}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? '→' : '←'}
        </button>
      )}
      <div className="sidebar-content">
        {children}
      </div>
    </aside>
  );
};

// Layout Wrapper (combines header, main, footer)
interface LayoutProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  sidebar?: React.ReactNode;
  footer?: React.ReactNode;
  sidebarPosition?: 'left' | 'right';
  className?: string;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  header,
  sidebar,
  footer,
  sidebarPosition = 'left',
  className = ''
}) => (
  <div className={`layout ${className}`.trim()}>
    {header && <div className="layout-header">{header}</div>}
    
    <div className="layout-body">
      {sidebar && sidebarPosition === 'left' && (
        <div className="layout-sidebar layout-sidebar-left">
          {sidebar}
        </div>
      )}
      
      <div className="layout-main">
        {children}
      </div>
      
      {sidebar && sidebarPosition === 'right' && (
        <div className="layout-sidebar layout-sidebar-right">
          {sidebar}
        </div>
      )}
    </div>
    
    {footer && <div className="layout-footer">{footer}</div>}
  </div>
);

// Spacer Component (for consistent spacing)
interface SpacerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  axis?: 'horizontal' | 'vertical' | 'both';
  className?: string;
}

export const Spacer: React.FC<SpacerProps> = ({
  size = 'md',
  axis = 'vertical',
  className = ''
}) => (
  <div className={`spacer spacer-${size} spacer-${axis} ${className}`.trim()} />
);

// Center Component (centers content)
interface CenterProps {
  children: React.ReactNode;
  axis?: 'horizontal' | 'vertical' | 'both';
  className?: string;
}

export const Center: React.FC<CenterProps> = ({
  children,
  axis = 'both',
  className = ''
}) => (
  <div className={`center center-${axis} ${className}`.trim()}>
    {children}
  </div>
);

// Aspect Ratio Component
interface AspectRatioProps {
  children: React.ReactNode;
  ratio?: '1:1' | '4:3' | '16:9' | '3:2' | '21:9';
  className?: string;
}

export const AspectRatio: React.FC<AspectRatioProps> = ({
  children,
  ratio = '16:9',
  className = ''
}) => {
  const ratioClass = `aspect-${ratio.replace(':', '-')}`;
  
  return (
    <div className={`aspect-ratio ${ratioClass} ${className}`.trim()}>
      <div className="aspect-ratio-content">
        {children}
      </div>
    </div>
  );
};

// Responsive Show/Hide Components
interface ShowProps {
  children: React.ReactNode;
  above?: 'sm' | 'md' | 'lg' | 'xl';
  below?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Show: React.FC<ShowProps> = ({
  children,
  above,
  below,
  className = ''
}) => {
  const classes = [
    above && `show-above-${above}`,
    below && `show-below-${below}`
  ].filter(Boolean).join(' ');

  return (
    <div className={`${classes} ${className}`.trim()}>
      {children}
    </div>
  );
};

export const Hide: React.FC<ShowProps> = ({
  children,
  above,
  below,
  className = ''
}) => {
  const classes = [
    above && `hide-above-${above}`,
    below && `hide-below-${below}`
  ].filter(Boolean).join(' ');

  return (
    <div className={`${classes} ${className}`.trim()}>
      {children}
    </div>
  );
};