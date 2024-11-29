import fs from 'fs';



const data = {
    
        "3XdluvWkn4NM3gFsvPNCtUDM5Oi1": {
            "selectedStages": {
                "choice1": {
                    "IDENTIFIANT": "20_1"
                },
                "choice2": {
                    "IDENTIFIANT": "55_1"
                },
                "choice3": {
                    "IDENTIFIANT": "9_1"
                },
                "choice4": {
                    "IDENTIFIANT": "6_1"
                },
                "choice5": {
                    "IDENTIFIANT": "92_1"
                }
            }
        },
        "4Bf1mBR9HjcLeFcDeuEVRrGDaU63": {
            "selectedStages": {
                "choice1": {
                    "IDENTIFIANT": "89_1"
                },
                "choice2": {
                    "IDENTIFIANT": "50_1"
                },
                "choice3": {
                    "IDENTIFIANT": "3_1"
                },
                "choice4": {
                    "IDENTIFIANT": "51_1"
                },
                "choice5": {
                    "IDENTIFIANT": "59_1"
                }
            }
        },
        "4XpuWt6oUEgmQ9IjEloUtqyd4c43": {
            "selectedStages": {
                "choice1": {
                    "IDENTIFIANT": "3_1"
                },
                "choice2": {
                    "IDENTIFIANT": "89_1"
                },
                "choice3": {
                    "IDENTIFIANT": "41_1"
                },
                "choice4": {
                    "IDENTIFIANT": "35_1"
                },
                "choice5": {
                    "IDENTIFIANT": "51_1"
                }
            }
        },
        "4qoWztDujictoqTEJvJK6xF1Zcr1": {
            "selectedStages": {
                "choice1": {
                    "IDENTIFIANT": "3_1"
                },
                "choice2": {
                    "IDENTIFIANT": "50_1"
                },
                "choice3": {
                    "IDENTIFIANT": "49_1"
                },
                "choice4": {
                    "IDENTIFIANT": "89_1"
                },
                "choice5": {
                    "IDENTIFIANT": "51_1"
                }
            }
        },
        "6Kza76qZHxOb8TlrP068rdr93br1": {
            "selectedStages": {
                "choice1": {
                    "IDENTIFIANT": "89_1"
                },
                "choice2": {
                    "IDENTIFIANT": "55_1"
                },
                "choice3": {
                    "IDENTIFIANT": "59_1"
                },
                "choice4": {
                    "IDENTIFIANT": "62_1"
                },
                "choice5": {
                    "IDENTIFIANT": "51_1"
                }
            }
        },
        "8YkNXMIQd4OiFHX0Ljm4LKsbZ2A2": {
            "selectedStages": {
                "choice1": {
                    "IDENTIFIANT": "4_1"
                },
                "choice2": {
                    "IDENTIFIANT": "44_1"
                },
                "choice3": {
                    "IDENTIFIANT": "89_1"
                },
                "choice4": {
                    "IDENTIFIANT": "52_1"
                },
                "choice5": {
                    "IDENTIFIANT": "51_1"
                }
            }
        },
        "A5gF87EUo6NdCaKoemDLN5V4gkF2": {
            "selectedStages": {
                "choice1": {
                    "IDENTIFIANT": "9_1"
                },
                "choice2": {
                    "IDENTIFIANT": "4_1"
                },
                "choice3": {
                    "IDENTIFIANT": "52_1"
                },
                "choice4": {
                    "IDENTIFIANT": "51_1"
                },
                "choice5": {
                    "IDENTIFIANT": "62_1"
                }
            }
        },
        "AXP0X3rUqzbpG3thTZcuZ6Ax1no1": {
            "selectedStages": {
                "choice1": {
                    "IDENTIFIANT": "3_1"
                },
                "choice2": {
                    "IDENTIFIANT": "49_1"
                },
                "choice3": {
                    "IDENTIFIANT": "50_1"
                },
                "choice4": {
                    "IDENTIFIANT": "62_1"
                },
                "choice5": {
                    "IDENTIFIANT": "94_1"
                }
            }
        },
        "AaVsgnDJcfc4ZG8BwfCezt1VSZA3": {
            "selectedStages": {
                "choice1": {
                    "IDENTIFIANT": "50_1"
                },
                "choice2": {
                    "IDENTIFIANT": "49_1"
                },
                "choice3": {
                    "IDENTIFIANT": "3_1"
                },
                "choice4": {
                    "IDENTIFIANT": "101_1"
                },
                "choice5": {
                    "IDENTIFIANT": "18_1"
                }
            }
        },
        "H4RtKMKXpYhJkTOTOOm62ANGNAo2": {
            "selectedStages": {
                "choice1": {
                    "IDENTIFIANT": "52_1"
                },
                "choice2": {
                    "IDENTIFIANT": "89_1"
                },
                "choice3": {
                    "IDENTIFIANT": "14_1"
                },
                "choice4": {
                    "IDENTIFIANT": "87_1"
                },
                "choice5": {
                    "IDENTIFIANT": "35_1"
                }
            }
        },
        "Hnqd1QWfsafGdmWBECGv7owgJFt2": {
            "selectedStages": {
                "choice1": {
                    "IDENTIFIANT": "49_1"
                },
                "choice2": {
                    "IDENTIFIANT": "43_1"
                },
                "choice3": {
                    "IDENTIFIANT": "51_1"
                },
                "choice4": {
                    "IDENTIFIANT": "35_1"
                },
                "choice5": {
                    "IDENTIFIANT": "18_1"
                }
            }
        },
        "Jg1Ejqc46rbcTHBwOMRYZZRwbTE2": {
            "selectedStages": {
                "choice1": {
                    "IDENTIFIANT": "3_1"
                },
                "choice2": {
                    "IDENTIFIANT": "95_1"
                },
                "choice3": {
                    "IDENTIFIANT": "50_1"
                },
                "choice4": {
                    "IDENTIFIANT": "56_1"
                },
                "choice5": {
                    "IDENTIFIANT": "89_1"
                }
            }
        },
        "KplEdkaz5na6IzzQUFxy8ldozMA2": {
            "selectedStages": {
                "choice1": {
                    "IDENTIFIANT": "63_1"
                },
                "choice2": {
                    "IDENTIFIANT": "95_1"
                },
                "choice3": {
                    "IDENTIFIANT": "44_1"
                },
                "choice4": {
                    "IDENTIFIANT": "52_1"
                },
                "choice5": {
                    "IDENTIFIANT": "4_1"
                }
            }
        },
        "M8ySAiobcuStMPVUKB1SUjfZO2D2": {
            "selectedStages": {
                "choice1": {
                    "IDENTIFIANT": "51_1"
                },
                "choice2": {
                    "IDENTIFIANT": "52_1"
                },
                "choice3": {
                    "IDENTIFIANT": "87_1"
                },
                "choice4": {
                    "IDENTIFIANT": "6_1"
                },
                "choice5": {
                    "IDENTIFIANT": "22_1"
                }
            }
        },
        "NKzeoLK9hlSWLKHy858f84dZ7jz1": {
            "selectedStages": {
                "choice1": {
                    "IDENTIFIANT": "43_1"
                },
                "choice2": {
                    "IDENTIFIANT": "41_1"
                },
                "choice3": {
                    "IDENTIFIANT": "28_1"
                },
                "choice4": {
                    "IDENTIFIANT": "15_1"
                },
                "choice5": {
                    "IDENTIFIANT": "4_1"
                }
            }
        },
        "Na44fbbTNZUjn7JIw6bBgLmTGmB2": {
            "selectedStages": {
                "choice1": {
                    "IDENTIFIANT": "35_1"
                },
                "choice2": {
                    "IDENTIFIANT": "18_1"
                },
                "choice3": {
                    "IDENTIFIANT": "50_1"
                },
                "choice4": {
                    "IDENTIFIANT": "32_1"
                },
                "choice5": {
                    "IDENTIFIANT": "101_1"
                }
            }
        },
        "PQKKiABo9oWhgcOKlmD5f1kKPoF3": {
            "selectedStages": {
                "choice1": {
                    "IDENTIFIANT": "92_1"
                },
                "choice2": {
                    "IDENTIFIANT": "89_1"
                },
                "choice3": {
                    "IDENTIFIANT": "51_1"
                },
                "choice4": {
                    "IDENTIFIANT": "52_1"
                },
                "choice5": {
                    "IDENTIFIANT": "43_1"
                }
            }
        },
        "QzBEdtlEIsfsg3pD6B1adFBmZSG2": {
            "selectedStages": {
                "choice1": {
                    "IDENTIFIANT": "87_1"
                },
                "choice2": {
                    "IDENTIFIANT": "6_1"
                },
                "choice3": {
                    "IDENTIFIANT": "94_1"
                },
                "choice4": {
                    "IDENTIFIANT": "4_1"
                },
                "choice5": {
                    "IDENTIFIANT": "0_1"
                }
            }
        },
        "R5PCIOnQeUhRSyFRTI9fg0Wp8p23": {
            "selectedStages": {
                "choice1": {
                    "IDENTIFIANT": "49_1"
                },
                "choice2": {
                    "IDENTIFIANT": "89_1"
                },
                "choice3": {
                    "IDENTIFIANT": "94_1"
                },
                "choice4": {
                    "IDENTIFIANT": "52_1"
                },
                "choice5": {
                    "IDENTIFIANT": "9_1"
                }
            }
        },
        "RY3eRRvuMhcM10siGR3QdhIHBI42": {
            "selectedStages": {
                "choice1": {
                    "IDENTIFIANT": "50_1"
                },
                "choice2": {
                    "IDENTIFIANT": "3_1"
                },
                "choice3": {
                    "IDENTIFIANT": "20_1"
                },
                "choice4": {
                    "IDENTIFIANT": "0_1"
                },
                "choice5": {
                    "IDENTIFIANT": "89_1"
                }
            }
        },
        "SodSajGZ6lhfjjwB8YB4pMYT3hZ2": {
            "selectedStages": {
                "choice1": {
                    "IDENTIFIANT": "49_1"
                },
                "choice2": {
                    "IDENTIFIANT": "20_1"
                },
                "choice3": {
                    "IDENTIFIANT": "50_1"
                },
                "choice4": {
                    "IDENTIFIANT": "3_1"
                },
                "choice5": {
                    "IDENTIFIANT": "85_1"
                }
            }
        },
        "T70EwGWJMtZ22rcprSkqiOcPzTf1": {
            "selectedStages": {
                "choice1": {
                    "IDENTIFIANT": "44_1"
                },
                "choice2": {
                    "IDENTIFIANT": "95_1"
                },
                "choice3": {
                    "IDENTIFIANT": "56_1"
                },
                "choice4": {
                    "IDENTIFIANT": "3_1"
                },
                "choice5": {
                    "IDENTIFIANT": "50_1"
                }
            }
        },
        "VO9wOi3JGvVchoaQvtNTidOABe03": {
            "selectedStages": {
                "choice1": {
                    "IDENTIFIANT": "101_1"
                },
                "choice2": {
                    "IDENTIFIANT": "41_1"
                },
                "choice3": {
                    "IDENTIFIANT": "18_1"
                },
                "choice4": {
                    "IDENTIFIANT": "43_1"
                },
                "choice5": {
                    "IDENTIFIANT": "35_1"
                }
            }
        },
        "Vnf1L8xxhFheK6RE3P18MGzMDkc2": {
            "selectedStages": {
                "choice1": {
                    "IDENTIFIANT": "89_1"
                },
                "choice2": {
                    "IDENTIFIANT": "41_1"
                },
                "choice3": {
                    "IDENTIFIANT": "51_1"
                },
                "choice4": {
                    "IDENTIFIANT": "52_1"
                },
                "choice5": {
                    "IDENTIFIANT": "62_1"
                }
            }
        },
        "WwfAPnGOElWCCprK8J9QpARedqV2": {
            "selectedStages": {
                "choice1": {
                    "IDENTIFIANT": "51_1"
                },
                "choice2": {
                    "IDENTIFIANT": "52_1"
                },
                "choice3": {
                    "IDENTIFIANT": "40_1"
                },
                "choice4": {
                    "IDENTIFIANT": "41_1"
                },
                "choice5": {
                    "IDENTIFIANT": "101_1"
                }
            }
        },
        "XK3sK3I48cMs89evbLhJZwBNlS92": {
            "selectedStages": {
                "choice1": {
                    "IDENTIFIANT": "49_1"
                },
                "choice2": {
                    "IDENTIFIANT": "50_1"
                },
                "choice3": {
                    "IDENTIFIANT": "20_1"
                },
                "choice4": {
                    "IDENTIFIANT": "3_1"
                },
                "choice5": {
                    "IDENTIFIANT": "52_1"
                }
            }
        },
        "XQtDBAPWalffkax0p7ml1k0yOtr2": {
            "selectedStages": {
                "choice1": {
                    "IDENTIFIANT": "49_1"
                },
                "choice2": {
                    "IDENTIFIANT": "50_1"
                },
                "choice3": {
                    "IDENTIFIANT": "101_1"
                },
                "choice4": {
                    "IDENTIFIANT": "43_1"
                },
                "choice5": {
                    "IDENTIFIANT": "15_1"
                }
            }
        },
        "YiI50LxSiZYDXMtiCNf6kwEWSQ42": {
            "selectedStages": {
                "choice1": {
                    "IDENTIFIANT": "51_1"
                },
                "choice2": {
                    "IDENTIFIANT": "3_1"
                },
                "choice3": {
                    "IDENTIFIANT": "49_1"
                },
                "choice4": {
                    "IDENTIFIANT": "89_1"
                },
                "choice5": {
                    "IDENTIFIANT": "50_1"
                }
            }
        },
        "aMpDSmIIsjZHIHJrVFGyKiLF94j2": {
            "selectedStages": {
                "choice1": {
                    "IDENTIFIANT": "92_1"
                },
                "choice2": {
                    "IDENTIFIANT": "52_1"
                },
                "choice3": {
                    "IDENTIFIANT": "35_1"
                },
                "choice4": {
                    "IDENTIFIANT": "40_1"
                },
                "choice5": {
                    "IDENTIFIANT": "41_1"
                }
            }
        },
        "atQ2mk9k2lUYzt9nrJgwsjyzz702": {
            "selectedStages": {
                "choice1": {
                    "IDENTIFIANT": "50_1"
                },
                "choice2": {
                    "IDENTIFIANT": "49_1"
                },
                "choice3": {
                    "IDENTIFIANT": "3_1"
                },
                "choice4": {
                    "IDENTIFIANT": "44_1"
                },
                "choice5": {
                    "IDENTIFIANT": "51_1"
                }
            }
        },
        "db0aQCgPMGgusm21XWqJ6RkXRvU2": {
            "selectedStages": {
                "choice1": {
                    "IDENTIFIANT": "14_1"
                },
                "choice2": {
                    "IDENTIFIANT": "40_1"
                },
                "choice3": {
                    "IDENTIFIANT": "3_1"
                },
                "choice4": {
                    "IDENTIFIANT": "20_1"
                },
                "choice5": {
                    "IDENTIFIANT": "51_1"
                }
            }
        },
        "djz1MyC7JsYen1wobYSUQC4aeF92": {
            "selectedStages": {
                "choice1": {
                    "IDENTIFIANT": "20_1"
                },
                "choice2": {
                    "IDENTIFIANT": "49_1"
                },
                "choice3": {
                    "IDENTIFIANT": "3_1"
                },
                "choice4": {
                    "IDENTIFIANT": "0_1"
                },
                "choice5": {
                    "IDENTIFIANT": "6_1"
                }
            }
        },
        "fE3EIKzXzKd3e7k8xoye5uc3PPd2": {
            "selectedStages": {
                "choice1": {
                    "IDENTIFIANT": "49_1"
                },
                "choice2": {
                    "IDENTIFIANT": "50_1"
                },
                "choice3": {
                    "IDENTIFIANT": "52_1"
                },
                "choice4": {
                    "IDENTIFIANT": "32_1"
                },
                "choice5": {
                    "IDENTIFIANT": "51_1"
                }
            }
        },
        "fgw7KyTqr4WAoThi0KjJtDRY7Ri2": {
            "selectedStages": {
                "choice1": {
                    "IDENTIFIANT": "35_1"
                },
                "choice2": {
                    "IDENTIFIANT": "26_1"
                },
                "choice3": {
                    "IDENTIFIANT": "0_1"
                },
                "choice4": {
                    "IDENTIFIANT": "89_1"
                },
                "choice5": {
                    "IDENTIFIANT": "18_1"
                }
            }
        },
        "h21ZyIpknGUksWjxUDLo2Mthwy92": {
            "selectedStages": {
                "choice1": {
                    "IDENTIFIANT": "35_1"
                },
                "choice2": {
                    "IDENTIFIANT": "18_1"
                },
                "choice3": {
                    "IDENTIFIANT": "32_1"
                },
                "choice4": {
                    "IDENTIFIANT": "15_1"
                },
                "choice5": {
                    "IDENTIFIANT": "0_1"
                }
            }
        },
        "hZTRrS8UMrfybYXKulfk1pI03jw2": {
            "selectedStages": {
                "choice1": {
                    "IDENTIFIANT": "18_1"
                },
                "choice2": {
                    "IDENTIFIANT": "22_1"
                },
                "choice3": {
                    "IDENTIFIANT": "32_1"
                },
                "choice4": {
                    "IDENTIFIANT": "101_1"
                },
                "choice5": {
                    "IDENTIFIANT": "0_1"
                }
            }
        },
        "i3VYPIfwLqTWfAL1E5HeHRRM5TE3": {
            "selectedStages": {
                "choice1": {
                    "IDENTIFIANT": "44_1"
                },
                "choice2": {
                    "IDENTIFIANT": "9_1"
                },
                "choice3": {
                    "IDENTIFIANT": "95_1"
                },
                "choice4": {
                    "IDENTIFIANT": "40_1"
                },
                "choice5": {
                    "IDENTIFIANT": "16_1"
                }
            }
        },
        "kBlGnRSNhgaQSTPumpAz4jZ7pgq2": {
            "selectedStages": {
                "choice1": {
                    "IDENTIFIANT": "50_1"
                },
                "choice2": {
                    "IDENTIFIANT": "44_1"
                },
                "choice3": {
                    "IDENTIFIANT": "41_1"
                },
                "choice4": {
                    "IDENTIFIANT": "43_1"
                },
                "choice5": {
                    "IDENTIFIANT": "3_1"
                }
            }
        },
        "lQVKbNduW7gdmCOBxC5KYnaIvGG3": {
            "selectedStages": {
                "choice1": {
                    "IDENTIFIANT": "44_1"
                },
                "choice2": {
                    "IDENTIFIANT": "56_1"
                },
                "choice3": {
                    "IDENTIFIANT": "95_1"
                },
                "choice4": {
                    "IDENTIFIANT": "89_1"
                },
                "choice5": {
                    "IDENTIFIANT": "52_1"
                }
            }
        },
        "lRjmWjDaAUcsqHli7A3rfvAazgl2": {
            "selectedStages": {
                "choice1": {
                    "IDENTIFIANT": "51_1"
                },
                "choice2": {
                    "IDENTIFIANT": "26_1"
                },
                "choice3": {
                    "IDENTIFIANT": "62_1"
                },
                "choice4": {
                    "IDENTIFIANT": "4_1"
                },
                "choice5": {
                    "IDENTIFIANT": "9_1"
                }
            }
        },
        "mGwDQ6cu9BfI9d0sLUVdZBnoooB2": {
            "selectedStages": {
                "choice1": {
                    "IDENTIFIANT": "89_1"
                },
                "choice2": {
                    "IDENTIFIANT": "49_1"
                },
                "choice3": {
                    "IDENTIFIANT": "15_1"
                },
                "choice4": {
                    "IDENTIFIANT": "85_1"
                },
                "choice5": {
                    "IDENTIFIANT": "4_1"
                }
            }
        },
        "nqvttcCyf3SL6YT1DJJ8GGM3MKz2": {
            "selectedStages": {
                "choice1": {
                    "IDENTIFIANT": "89_1"
                },
                "choice2": {
                    "IDENTIFIANT": "59_1"
                },
                "choice3": {
                    "IDENTIFIANT": "50_1"
                },
                "choice4": {
                    "IDENTIFIANT": "55_1"
                },
                "choice5": {
                    "IDENTIFIANT": "49_1"
                }
            }
        },
        "qMjlyqwW8wN9IsVapiUoCXrJjOG2": {
            "selectedStages": {
                "choice1": {
                    "IDENTIFIANT": "18_1"
                },
                "choice2": {
                    "IDENTIFIANT": "40_1"
                },
                "choice3": {
                    "IDENTIFIANT": "0_1"
                },
                "choice4": {
                    "IDENTIFIANT": "52_1"
                },
                "choice5": {
                    "IDENTIFIANT": "51_1"
                }
            }
        },
        "sJ0z0k4idEg6PMCnMrjW3lho9cs1": {
            "selectedStages": {
                "choice1": {
                    "IDENTIFIANT": "13_1"
                },
                "choice2": {
                    "IDENTIFIANT": "6_1"
                },
                "choice3": {
                    "IDENTIFIANT": "50_1"
                },
                "choice4": {
                    "IDENTIFIANT": "56_1"
                },
                "choice5": {
                    "IDENTIFIANT": "87_1"
                }
            }
        },
        "ta5fEsMcBHV64fLfjy7knGlQVd93": {
            "selectedStages": {
                "choice1": {
                    "IDENTIFIANT": "52_1"
                },
                "choice2": {
                    "IDENTIFIANT": "51_1"
                },
                "choice3": {
                    "IDENTIFIANT": "89_1"
                },
                "choice4": {
                    "IDENTIFIANT": "50_1"
                },
                "choice5": {
                    "IDENTIFIANT": "62_1"
                }
            }
        },
        "tc2VPj6NxHQyXqO9cxgs1VvCH9A2": {
            "selectedStages": {
                "choice1": {
                    "IDENTIFIANT": "101_1"
                },
                "choice2": {
                    "IDENTIFIANT": "26_1"
                },
                "choice3": {
                    "IDENTIFIANT": "9_1"
                },
                "choice4": {
                    "IDENTIFIANT": "40_1"
                },
                "choice5": {
                    "IDENTIFIANT": "43_1"
                }
            }
        },
        "ugBbi96TQGRuQLKFwT43qJHa4za2": {
            "selectedStages": {
                "choice1": {
                    "IDENTIFIANT": "92_1"
                },
                "choice2": {
                    "IDENTIFIANT": "59_1"
                },
                "choice3": {
                    "IDENTIFIANT": "51_1"
                },
                "choice4": {
                    "IDENTIFIANT": "62_1"
                },
                "choice5": {
                    "IDENTIFIANT": "55_1"
                }
            }
        },
        "uwUTp2rxDHhytEej6vKfcVlOCY73": {
            "selectedStages": {
                "choice1": {
                    "IDENTIFIANT": "26_1"
                },
                "choice2": {
                    "IDENTIFIANT": "18_1"
                },
                "choice3": {
                    "IDENTIFIANT": "101_1"
                },
                "choice4": {
                    "IDENTIFIANT": "43_1"
                },
                "choice5": {
                    "IDENTIFIANT": "32_1"
                }
            }
        },
        "v0Bv2oLhCkhDJvVvXktZsmnj16U2": {
            "selectedStages": {
                "choice1": {
                    "IDENTIFIANT": "63_1"
                },
                "choice2": {
                    "IDENTIFIANT": "49_1"
                },
                "choice3": {
                    "IDENTIFIANT": "3_1"
                },
                "choice4": {
                    "IDENTIFIANT": "50_1"
                },
                "choice5": {
                    "IDENTIFIANT": "20_1"
                }
            }
        },
        "wb6ciGEN2tVpmU0Ld5ftdVCy1Qi1": {
            "selectedStages": {
                "choice1": {
                    "IDENTIFIANT": "26_1"
                },
                "choice2": {
                    "IDENTIFIANT": "40_1"
                },
                "choice3": {
                    "IDENTIFIANT": "0_1"
                },
                "choice4": {
                    "IDENTIFIANT": "6_1"
                },
                "choice5": {
                    "IDENTIFIANT": "59_1"
                }
            }
        },
        "yWShM6jbuNcck2CfI0ihEtckesW2": {
            "selectedStages": {
                "choice1": {
                    "IDENTIFIANT": "56_1"
                },
                "choice2": {
                    "IDENTIFIANT": "16_1"
                },
                "choice3": {
                    "IDENTIFIANT": "52_1"
                },
                "choice4": {
                    "IDENTIFIANT": "51_1"
                },
                "choice5": {
                    "IDENTIFIANT": "89_1"
                }
            }
        },
        "yn7VMvQNy8gz9G2SrHjsYIuCfxA2": {
            "selectedStages": {
                "choice1": {
                    "IDENTIFIANT": "40_1"
                },
                "choice2": {
                    "IDENTIFIANT": "52_1"
                },
                "choice3": {
                    "IDENTIFIANT": "20_1"
                },
                "choice4": {
                    "IDENTIFIANT": "89_1"
                },
                "choice5": {
                    "IDENTIFIANT": "4_1"
                }
            }
        }
     
};


const availableChoices = [
    '0_1',  '3_1', '4_1', '6_1', '9_1', '13_1', '13_1', '13_1', '14_1',
    '15_1', '16_1', '17_1', '18_1', '20_1', '22_1', '26_1', '28_1', '32_1',
    '32_1', '34_1', '35_1', '36_1', '36_1', '37_1', '38_1', '39_1', '40_1',
    '41_1', '41_1', '42_1', '43_1', '44_1', '45_1', '45_1', '49_1',
    '49_1', '49_1', '50_1', '51_1', '52_1', '53_1', '53_1', '55_1', '56_1',
    '57_1', '59_1', '62_1', '63_1',   '78_1', 
    '85_1', '87_1', '89_1', '92_1', '94_1', '95_1', '101_1'
];



// Calcul des capacités pour chaque choix
let choiceCapacities = {};
for (let choice of availableChoices) {
    choiceCapacities[choice] = (choiceCapacities[choice] || 0) + 1;
}

// Compter le nombre d'étudiants qui ont demandé chaque choix
let choiceDemands = {};
const userIds = Object.keys(data);
const priorities = ['choice1', 'choice2', 'choice3', 'choice4', 'choice5'];

for (const id of userIds) {
    const userStages = data[id]?.selectedStages;
    for (const priority of priorities) {
        const desiredChoice = userStages?.[priority]?.IDENTIFIANT;
        if (desiredChoice) {
            choiceDemands[desiredChoice] = (choiceDemands[desiredChoice] || 0) + 1;
        }
    }
}

// Afficher le nombre d'étudiants qui ont demandé chaque place
console.log('Nombre d\'étudiants par place demandée :');
for (const choice in choiceCapacities) {
    const demand = choiceDemands[choice] || 0;
    const capacity = choiceCapacities[choice];
    console.log(`Place ${choice}: ${demand} demandes, capacité ${capacity}`);
}

// Fonction pour assigner les choix en minimisant le nombre de lésés
function assignChoicesMinimizingLeses() {
    let assignedChoices = {}; // Stocke les choix assignés
    let remainingCapacities = { ...choiceCapacities }; // Capacités restantes pour chaque choix

    // Initialisation des choix assignés pour chaque utilisateur
    for (const id of userIds) {
        assignedChoices[id] = null;
    }

    // Trier les choix par ordre croissant de demandes pour équilibrer la répartition
    const sortedChoices = Object.keys(choiceDemands).sort((a, b) => {
        const demandA = choiceDemands[a];
        const demandB = choiceDemands[b];
        return demandA - demandB;
    });

    // Parcours des niveaux de priorité
    for (let priorityIndex = 0; priorityIndex < priorities.length; priorityIndex++) {
        const priority = priorities[priorityIndex];

        // Parcours de chaque choix, du moins demandé au plus demandé
        for (const choice of sortedChoices) {
            if (remainingCapacities[choice] <= 0) continue;

            // Trouver les utilisateurs qui ont ce choix à cette priorité
            const usersWantingChoice = userIds.filter(id => {
                if (assignedChoices[id]) return false;
                const userStages = data[id]?.selectedStages;
                const desiredChoice = userStages?.[priority]?.IDENTIFIANT;
                return desiredChoice === choice;
            });

            // Assigner les utilisateurs jusqu'à épuisement de la capacité
            const capacity = remainingCapacities[choice];
            const usersToAssign = usersWantingChoice.slice(0, capacity);

            for (const id of usersToAssign) {
                assignedChoices[id] = {
                    id,
                    assignedChoice: choice,
                    priority: `priorité ${priority.replace('choice', '')}`
                };
            }

            remainingCapacities[choice] -= usersToAssign.length;

            // Si la capacité est épuisée, passer au choix suivant
            if (remainingCapacities[choice] <= 0) continue;
        }
    }

    // Pour les utilisateurs non assignés, assigner des choix restants
    for (const id of userIds) {
        if (!assignedChoices[id]) {
            const remainingChoiceKeys = Object.keys(remainingCapacities).filter(
                (choice) => remainingCapacities[choice] > 0
            );

            if (remainingChoiceKeys.length > 0) {
                const randomChoice =
                    remainingChoiceKeys[
                        Math.floor(Math.random() * remainingChoiceKeys.length)
                    ];
                assignedChoices[id] = {
                    id,
                    assignedChoice: randomChoice,
                    priority: 'lésé' // Indique que l'utilisateur n'a obtenu aucun choix préféré
                };
                remainingCapacities[randomChoice]--;
            } else {
                // Plus aucun choix disponible
                assignedChoices[id] = {
                    id,
                    assignedChoice: null,
                    priority: 'Aucun choix disponible'
                };
            }
        }
    }

    return assignedChoices;
}

// Exécuter la fonction d'assignation
const assignedChoices = assignChoicesMinimizingLeses();

// Ajouter le nombre d'étudiants au début du JSON
const output = {
    nombreEtudiants: userIds.length,
    assignedChoices
};

// Afficher les résultats
console.log('Choix assignés : ', output);

// Sauvegarder les choix assignés dans un fichier si nécessaire
fs.writeFileSync('assignedChoices.json', JSON.stringify(output, null, 2));