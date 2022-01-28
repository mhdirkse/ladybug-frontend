describe('About opened reports', function() {
  beforeEach(() => {
    cy.createReport();
    cy.createOtherReport();
    cy.visit('')
  });

  afterEach(() => {
    cy.clearDebugStore();
  });

  it('Close one', function() {
    cy.get('button[id="Open AllButton"]').click();
    // Each of the two reports has three lines.
    cy.get('div.treeview > ul > li').should('have.length', 6);
    cy.get('div.treeview > ul > li:contains(name)').first().click();
    cy.get('#CloseButton').click();
    cy.get('div.treeview > ul > li').should('have.length', 3);
    // nth-child has an 1-based index
    cy.get('div.treeview > ul > li:nth-child(1)').should('have.text', 'otherName').click();
    cy.get('#CloseButton').click();
    cy.get('div.treeview > ul > li').should('have.length', 0);
  });

  it('Close all', function() {
    cy.get('.table-responsive tbody tr td:contains(name)').first().click();
    cy.get('div.treeview > ul > li').should('have.length', 3);
    cy.get('.table-responsive tbody tr td:contains("otherName")').first().click();
    cy.get('div.treeview > ul > li').should('have.length', 6);
    // Check sequence of opened reports. We expect "name" first, then "otherName".
    cy.get('div.treeview > ul > li:nth-child(1)').should('have.text', 'name');
    cy.get('div.treeview > ul > li:nth-child(4)').should('have.text', 'otherName');
    cy.get('button[id="Close AllButton"]').click();
    cy.get('div.treeview > ul > li').should('have.length', 0);
  })

  it('Expand and collapse', function() {
    cy.get('button[id="Open AllButton"]').click();    
    cy.get('div.treeview > ul > li').should('have.length', 6);
    cy.get('div.treeview > ul > li:contains(name)').should('have.length', 3);
    cy.get('div.treeview > ul > li:contains(name)').within(($lines) => {
      expect($lines.eq(0).children().eq(0)).to.have.prop('nodeName', 'SPAN');
      expect($lines.eq(0).children().eq(0)).to.have.class('expand-icon');
      expect($lines.eq(0).children().eq(1)).to.have.prop('nodeName', 'SPAN');
      expect($lines.eq(0).children().eq(1)).to.have.class('node-icon');
      expect($lines.eq(0).children('img')).to.have.length(0);
      expect($lines.eq(1).children().eq(0)).to.have.prop('nodeName', 'SPAN');
      expect($lines.eq(1).children().eq(1)).to.have.prop('nodeName', 'SPAN');
      expect($lines.eq(1).children().eq(2)).to.have.prop('nodeName', 'SPAN');
      expect($lines.eq(1).children().eq(3)).to.have.prop('nodeName', 'IMG');
      expect($lines.eq(1).children().eq(0)).to.have.class('indent');
      expect($lines.eq(1).children().eq(1)).to.have.class('expand-icon');
      expect($lines.eq(1).children().eq(2)).to.have.class('node-icon');
      expect($lines.eq(1).children().eq(3).attr('src')).contains('startpoint-even.gif');
      expect($lines.eq(2).children().eq(0)).to.have.prop('nodeName', 'SPAN');
      expect($lines.eq(2).children().eq(1)).to.have.prop('nodeName', 'SPAN');
      expect($lines.eq(2).children().eq(2)).to.have.prop('nodeName', 'SPAN');
      expect($lines.eq(2).children().eq(3)).to.have.prop('nodeName', 'SPAN');
      expect($lines.eq(2).children().eq(4)).to.have.prop('nodeName', 'IMG');
      expect($lines.eq(2).children().eq(0)).to.have.class('indent');
      expect($lines.eq(2).children().eq(1)).to.have.class('indent');
      expect($lines.eq(2).children().eq(2)).to.have.class('glyphicon');
      expect($lines.eq(2).children().eq(3)).to.have.class('node-icon');
      expect($lines.eq(2).children().eq(4).attr('src')).contains('endpoint-odd.gif');
    });
  });
});