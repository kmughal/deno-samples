
const files = Deno.watchFs(Deno.cwd());

const cmd = "deno run --allow-net --allow-read index.ts".split(" ")
console.log(cmd)
// let p = Deno.run({
//     cmd,
//     stdout: "piped",
//     stderr: "piped",
// })

// let { code } = await p.status();
// if (code === 0) {
//     const rawOutput = await p.output();
//     await Deno.stdout.write(rawOutput);
// } else {
//     const rawError = await p.stderrOutput();
//     const errorString = new TextDecoder().decode(rawError);
//     console.log(errorString);
// }
let p = Deno.run({
    cmd,
    stdout: "piped",
    stderr: "piped",
});

await p.status();
for await (const file of files) {
    console.log("starting again :");
    if (p) p.close();
    p = Deno.run({
        cmd,
        stdout: "piped",
        stderr: "piped",
    });
    let { code } = await p.status();
    if (code === 0) {
        const rawOutput = await p.output();
        await Deno.stdout.write(rawOutput);
    } else {
        const rawError = await p.stderrOutput();
        const errorString = new TextDecoder().decode(rawError);
        console.log(errorString);
    }

}