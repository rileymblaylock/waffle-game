def split_words():
    output = []

    with open("./python/txt/wordList.txt") as f:
        lines = f.read().splitlines()
        for line in lines:
            words = line.split(" ")
            for word in words:
                output.append(word)
    
    with open("./python/txt/wordListOutput.txt", "w") as f:
        for word in output:
            f.write("'")
            f.write(word)
            f.write("', ")

split_words()
