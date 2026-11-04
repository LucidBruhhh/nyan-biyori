/* にゃん日和 — stray cats who visit the window, and the story of where your cat came from */
'use strict';
window.NB = window.NB || {};

NB.Visitors = (function () {
  const LIST = [
    { id: 'kuro', jp: 'クロ', en: 'Kuro', title: 'the alley boss', look: { fur: 'kuro', eye: 'midori', acc: {} },
      story: ['Kuro stares through the glass like he owns the street. He probably does.', 'Kuro accepted the treat without saying thank you. Typical.', 'Kuro has a notch in his ear. He says he won it in a fight with a crow.', 'Kuro brought his own fish today and shared it with the window. A strange gift, but a gift.', 'Kuro sat by the window all evening. He purred once, then pretended he didn\'t.'] },
    { id: 'mikan', jp: 'ミカン', en: 'Mikan', title: 'the café cat', look: { fur: 'mikan', eye: 'amber', acc: {} },
      story: ['Mikan smells faintly of coffee and cake. She lives at the café on the corner.', 'Mikan says the café owner calls her "manager". She takes it very seriously.', 'Mikan told your cat all the café gossip. There was a lot of it.', 'Mikan says the café gets lonely at closing time. She visits you after.', 'Mikan curled up on the ledge and fell asleep. Friends do that.'] },
    { id: 'tama', jp: 'タマ', en: 'Grandpa Tama', title: 'the old wanderer', look: { fur: 'haiiro', eye: 'sora', acc: {} },
      story: ['An old grey cat with sleepy eyes. He moves slowly, like he has seen everything.', 'Tama says he has walked every street in this ward. Twice.', 'Tama remembers when the tower was built. Or he says he does.', 'Tama told your cat where the warmest rooftops are. Very valuable information.', 'Tama says he is glad your cat found a home. He is still looking for his.'] },
    { id: 'hoshi', jp: 'ホシ', en: 'Hoshi', title: 'a shy kitten', look: { fur: 'shiro', eye: 'murasaki', acc: {} },
      story: ['A tiny white kitten peeks over the ledge, then ducks away.', 'Hoshi stayed a little longer this time. Her tail was shaking.', 'Hoshi touched noses with your cat through the glass. Very brave.', 'Hoshi follows Grandpa Tama around now. He pretends not to mind.', 'Hoshi waits at the window every evening. She has decided you are family.'] },
  ];
  const TREAT_COST = 15, MAX_HEARTS = 5;

  // where your cat came from, revealed as your bond grows
  const CHAPTERS = [
    { id: 1, need: (st, stage) => stage >= 1, title: 'The rainy alley', lines: ['Before you, I lived behind a ramen shop.', 'The rain was loud and the cardboard was always soggy.', 'A kind old lady left fish for me on Tuesdays. I learned to count the days.', 'Then one night someone carried me somewhere warm. That was you.'] },
    { id: 2, need: (st, stage) => stage >= 2, title: 'The lost bell', lines: ['I used to wear a little bell.', 'I lost it chasing a moth under a vending machine.', 'Sometimes I hear a bell in the street and my ears turn all the way round.', 'Maybe someone else is wearing it now. I hope they like it.'] },
    { id: 3, need: (st, stage) => stage >= 3, title: 'The hydrangea garden', lines: ['The old lady with the fish had a garden full of hydrangeas.', 'She called me Mii-chan, which is not my name, but I allowed it.', 'One spring her shutters were closed and the garden was quiet.', 'I looked for her for a long time. Then I stopped looking and started hoping.'] },
    { id: 4, need: (st) => st.level >= 10, title: 'Learning to stay', lines: ['When you first brought me home, I hid in the box.', 'You did not pull me out. You sat nearby and talked about your day.', 'You did that every day.', 'That is when I decided you might be okay.'] },
    { id: 5, need: (st, stage) => stage >= 4, title: 'Home', lines: ['I used to think home was a place with no rain.', 'Now I think home is the sound of you coming back.', 'I am not a stray anymore.', 'I am yours. And you are mine.'] },
  ];

  return { LIST, TREAT_COST, MAX_HEARTS, CHAPTERS, get: (id) => LIST.find((v) => v.id === id) };
})();
