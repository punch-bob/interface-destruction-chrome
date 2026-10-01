// Пиксельные силуэты: металл, блики, деревянные детали, магазин и энергетические вставки.
const PIXELS: Record<string, string> = {
  "#": "#07111e",
  s: "#536a83",
  m: "#9cbed0",
  h: "#edf8ff",
  d: "#2b3c54",
  w: "#945c3c",
  W: "#d49a65",
  c: "#75f4ff",
  o: "#ffc970",
  r: "#e36955",
  g: "#6f8558",
  G: "#b6c28b",
};
const MODELS = [
  [
    "        ####              ",
    "  ######mmmh############  ",
    " #hhhhhhhhhhhhhhhhhhmmms# ",
    " #mmmmmmmmmmmmmmmmmmssssd# ",
    " #ssssdsssssssssssddddddd# ",
    "  ####ssss##############  ",
    "     #wws#  #s#           ",
    "     #Wws# #s#            ",
    "    #Wws###s#             ",
    "    #wws####              ",
    "    #wws#                 ",
    "   #Wws#                  ",
    "   ####                   ",
  ],
  [
    "             ##                 ",
    "             #m#                ",
    "      ########h################ ",
    "     #hhhhhhhhhhhhhhhhhhhhhssssh#",
    "#### #mmmmmmmmmmmmmmmsssssssssss#",
    "#WWw##sssssdddddddddddddddddddd# ",
    "#Wwwwwsssss####WWWWWWWW######## ",
    " #wwwwwsss#   #wwwwwwww#        ",
    "  #####ww# ####wwwwwwww#        ",
    "      #ww##s#  ########         ",
    "      #ww###                   ",
    "      ####                     ",
  ],
  [
    "              ####              ",
    "              #cc#              ",
    "          #####ss######         ",
    "         #hhhhhhhhhhhhh######## ",
    "######   #mmmsmmmsmmmsmssssssssh#",
    "#mmms#####sssdsssdsssdsssssssss# ",
    "#ssdssssssssssssssssss######### ",
    " #ddddddddssddddddddddd#         ",
    "  ########ss####ssss##          ",
    "         #ws#  #dmd#            ",
    "         #ww#  #dmd#            ",
    "        #ww#   #dmd#            ",
    "        ####   #ddd#            ",
    "                ###             ",
  ],
  [
    "           ############             ",
    "          #hmmmsmmmmmmmc#            ",
    "          #sdddssssssssc#            ",
    "           ####ss######             ",
    "             ##ss##                 ",
    "       ######hhhhhh################ ",
    "      #mmmmmmmmmmmmmmmmssssssssssssh#",
    "######ssdddddddddddddd############# ",
    "#WWWwwwwwsss###ss####               ",
    "#Wwwwwwssww#  #ss#                  ",
    " ######wwww#   ###                  ",
    "      #www#                         ",
    "      ####                          ",
  ],
  [
    "    ######                        ",
    "   #hhhomm#                       ",
    "  #ommmrrs#        #####          ",
    "  #ommmrrs#########hhhhh########  ",
    "  #ommmrrssssssssssmmmmmsrrrrrrho#",
    "  #ommmrrssssssssssdddddsrrrrrroo#",
    "  #ommmrrs#########ssss########  ",
    "   #ossoss# #ss#    ####           ",
    "    #sssss##sss#                  ",
    "    #rsssrrssss#                  ",
    "     #rrrsssss#                   ",
    "      ########                    ",
  ],
  [
    "             #####               ",
    "             #ooo#               ",
    "  ###########sssss############## ",
    " #hhGGGGGGGGGGGGGGGGGGGGGGhhhmmh#",
    " #mmggggggggggggggggggggggmmmsss#",
    " #ssgddgddgddgddgddgddgddgsssssd#",
    " #dddgggggggggggggggggggggdddddd#",
    "  ############sss############### ",
    "          #ws#   #ws#            ",
    "          #ww#   #ww#            ",
    "         #ww#    ####            ",
    "         ####                    ",
  ],
  [
    "          #####               ",
    "          #ooo#               ",
    "      ####sssss########       ",
    "     #hhhhhhmmmmmmmmmmm######  ",
    "######mmmssmmssmmssmmssmmmssh# ",
    "#WWwwwsssddssddssddssddsssssd#",
    "#Wwwwwsssddssddssddssddssssd# ",
    " ######ssddssddssddssdd####   ",
    "       #wws########sss#       ",
    "       #ww#        ###        ",
    "      #ww#                   ",
    "      ####                   ",
  ],
];

export const drawPixelWeapon = (
  ctx: CanvasRenderingContext2D,
  weapon: number,
) => {
  const rows = MODELS[weapon - 1];
  if (!rows) {
    return;
  }
  const pixel = 2;
  rows.forEach((row, y) => {
    [...row].forEach((value, x) => {
      const color = PIXELS[value];
      if (!color) {
        return;
      }
      ctx.fillStyle = color;
      ctx.fillRect(x * pixel - 20, y * pixel - 12, pixel, pixel);
    });
  });
};
