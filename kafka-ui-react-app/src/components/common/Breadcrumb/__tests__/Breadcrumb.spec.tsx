import { mount } from 'enzyme';
import React from 'react';
import { StaticRouter } from 'react-router-dom';
import Breadcrumb, { Link } from '../Breadcrumb';

describe('Breadcrumb component', () => {
  const links: Link[] = [
    {
      label: 'link1',
      href: 'link1href',
    },
    {
      label: 'link2',
      href: 'link2href',
    },
    {
      label: 'link3',
      href: 'link3href',
    },
  ];

  const child = <div className="child" />;

  const component = mount(
    <StaticRouter>
      <Breadcrumb links={links}>{child}</Breadcrumb>
    </StaticRouter>
  );

  it('renders the list of links', () => {
    component.find(`NavLink`).forEach((link, idx) => {
      expect(link.prop('to')).toEqual(links[idx].href);
      expect(link.contains(links[idx].label)).toBeTruthy();
    });
  });
  it('renders the children', () => {
    expect(
      component
        .find('[data-testid="breadcrumb-children-wrapper"]')
        .contains(child)
    ).toBeTruthy();
  });
});
